import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.hubert.watchlist",
  projectId: "663540df0035dda5b6d9",
  storageId: "663544f900313697bb04",
  databaseId: "66354199003df7659697",
  userCollectionId: "663541ae002ee76150e6",
  videoCollectionId: "663541d5001cddf156fa",
  showsCollectionId: "663610e4000e967df1ea",
  categoriesCollectionId: "663615c400037f458266",
  platformsCollectionId: "663615e200099365a2f3",
  userShowProgressCollectionId: "66361736000c05a35e52",
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

async function seedSeries() {
  try {
    // Pobierz dane z API
    const response = await fetch(
      "https://imdb-top-100-movies.p.rapidapi.com/series/",
      {
        headers: {
          "X-RapidAPI-Key":
            "187be517abmsh78c015f5ff043aap196e49jsnf27b23139ad6",
          "X-RapidAPI-Host": "imdb-top-100-movies.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) throw new Error("Network response was not ok.");

    const series = await response.json();
    // Zapisz dane w Appwrite
    for (const serie of series) {
      const showId = ID.unique();
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.showsCollectionId,
        showId,
        {
          title: serie.title,
          description: serie.description,
          image: serie.image,
          rating: serie.rating,
          year: serie.year,
          numberOfEpisodes: Math.floor(Math.random() * (50 - 10 + 1) + 10),
          type: "series",
        }
      );
      // console.log("Show added:", serie.title);
    }
  } catch (error) {
    console.error("Error seeding shows:", error);
  }
}
async function seedMovies() {
  try {
    // Pobierz dane z API
    const response = await fetch(
      "https://imdb-top-100-movies.p.rapidapi.com/",
      {
        headers: {
          "X-RapidAPI-Key":
            "187be517abmsh78c015f5ff043aap196e49jsnf27b23139ad6",
          "X-RapidAPI-Host": "imdb-top-100-movies.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) throw new Error("Network response was not ok.");

    const movies = await response.json();

    // Zapisz dane w Appwrite
    for (const movie of movies) {
      const showId = ID.unique();
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.showsCollectionId,
        showId,
        {
          title: movie.title,
          description: movie.description,
          image: movie.image,
          rating: parseFloat(movie.rating),
          year: movie.year.toString(),
          numberOfEpisodes: Math.floor(Math.random() * (50 - 10 + 1) + 10),
          type: "movie",
        }
      );
      // console.log("Show added:", movie.title);
    }
  } catch (error) {
    console.error("Error seeding shows:", error);
  }
}
// seedSeries();
// seedMovies();

// Register user
export async function createUser(email, password, username) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Sign In
export async function signIn(email, password) {
  try {
    const session = await account.createEmailSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  const { mimeType, ...rest } = file;
  const asset = { type: mimeType, ...rest };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Get File Preview
export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getAllCategories() {
  try {
    const categories = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesCollectionId
    );

    return categories.documents;
  } catch (error) {
    throw new Error(error);
  }
}
export async function getAllShows() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.showsCollectionId
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts created by user
export async function getUserPosts(userId) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts that matches search query
export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get latest created video posts
export async function getLatestPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}
async function fetchCategoriesAndPlatforms() {
  try {
    // Fetch all categories
    const categoriesResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesCollectionId
    );
    const categories = categoriesResponse.documents;

    // Fetch all platforms
    const platformsResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.platformsCollectionId
    );
    const platforms = platformsResponse.documents;

    return { categories, platforms };
  } catch (error) {
    console.error("Failed to fetch categories and platforms:", error);
    return { categories: [], platforms: [] }; // Return empty arrays on error
  }
}
async function seedShowCategoriesAndPlatforms() {
  const { categories, platforms } = await fetchCategoriesAndPlatforms();
  const shows = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.showsCollectionId
  );

  try {
    for (const show of shows.documents) {
      // console.log(show.$id);

      // Randomly pick up to 3 categories
      const randomCategories = categories
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const categoryIds = randomCategories.map((cat) => cat.$id); // Gather IDs in an array

      // Randomly pick up to 3 platforms
      const randomPlatforms = platforms
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const platformIds = randomPlatforms.map((plat) => plat.$id); // Gather IDs in an array

      // Update each show document with random category and platform IDs
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.showsCollectionId,
        show.$id,
        {
          categories: categoryIds,
          platforms: platformIds,
        }
      );
    }
  } catch (error) {
    console.error("Error seeding show categories and platforms:", error);
  }
}

// seedShowCategoriesAndPlatforms();

export async function fetchCategoriesAndPlatformsForSpecificShow(showId) {
  // console.log("Fetching categories and platforms for show:", showId)
  try {
    // Fetch all category documents related to the specific show
    const categoriesResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.showCategoriesCollectionId,
      [`show_id=${showId}`] // Query filter directly by show_id
    );
    // Fetch all platform documents related to the specific show
    const platformsResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.showPlatformsCollectionId,
      [`show_id=${showId}`] // Query filter directly by show_id
    );

    // Mapping the results to extract relevant information
    const categories = categoriesResponse.documents.map((doc) => ({
      id: doc.$id,
      name: doc.name,
    }));
    const platforms = platformsResponse.documents.map((doc) => ({
      id: doc.$id,
      name: doc.name,
    }));

    return {
      categories,
      platforms,
    };
  } catch (error) {
    console.error("Error fetching categories and platforms:", error);
    throw new Error("Failed to fetch categories and platforms");
  }
}

export async function addToWatchlist(showId) {
  try {
    const session = await account.getSession('current');
    const userId = session.userId;

    if (!userId) {
      alert("Please log in to add shows to your watchlist.");
      return;
    }

    // Properly formatted query using Query.equal
    const response = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.userShowProgressCollectionId, [
      Query.equal('user_id', userId),
      Query.equal('show_id', showId),
    ]);

    if (response.documents.length > 0) {
      // Show is already in the watchlist, remove it
      await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.userShowProgressCollectionId, response.documents[0].$id);
      alert('Show removed from your watchlist.');
    } else {
      // Show is not in the watchlist, add it
      await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.userShowProgressCollectionId, 'unique()', {
        user_id: userId,
        show_id: showId,
        watched: false,
        current_episode: 0,
      });
      alert('Show added to your watchlist.');
    }
  } catch (error) {
    console.error('Error managing the watchlist:', error);
    alert('Error managing your watchlist.');
  }
};