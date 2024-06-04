import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.hubert.watchlist",
  projectId: "663540df0035dda5b6d9",
  storageId: "663544f900313697bb04",
  databaseId: "66354199003df7659697",
  userCollectionId: "663541ae002ee76150e6",
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
const avatars = new Avatars(client);
const databases = new Databases(client);

export async function getList() {
  try {
    const session = await account.getSession("current");
    const userId = session.userId;

    const progress = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userShowProgressCollectionId,
      [Query.equal("user_id", userId)]
    );

    const showsPromises = progress.documents.map((doc) =>
      databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.showsCollectionId,
        doc.show_id
      )
    );
    const showsDetails = await Promise.all(showsPromises);

    const userShows = progress.documents.map((prog, index) => ({
      ...prog,
      showDetails: showsDetails[index],
    }));

    return userShows;
  } catch (error) {
    console.error("Error fetching user shows:", error);
    throw new Error("Failed to fetch user shows.");
  }
}

export async function updateEpisodeCount(docId, change) {
  try {
    const currentProgress = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userShowProgressCollectionId,
      docId
    );

    const showDetails = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.showsCollectionId,
      currentProgress.show_id
    );

    let newEpisodeCount = currentProgress.current_episode + change;
    const maxEpisodes = showDetails.numberOfEpisodes;

    newEpisodeCount = Math.max(0, Math.min(newEpisodeCount, maxEpisodes));

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userShowProgressCollectionId,
      docId,
      {
        current_episode: newEpisodeCount,
      }
    );

    return await getList();
  } catch (error) {
    console.error("Error updating episode count:", error);
    throw new Error("Failed to update episode count.");
  }
}

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

    const platforms = await getAllPlatforms();

    const randomPlatforms = platforms
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const platformsIds = randomPlatforms.map((cat) => cat.$id);

    const categories = await getAllCategories();
    const randomCategories = categories
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const categoriesIds = randomCategories.map((cat) => cat.$id);

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
          categories: categoriesIds,
          platforms: platformsIds,
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

    const platforms = await getAllPlatforms();

    const randomPlatforms = platforms
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const platformsIds = randomPlatforms.map((cat) => cat.$id);

    const categories = await getAllCategories();
    const randomCategories = categories
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const categoriesIds = randomCategories.map((cat) => cat.$id);

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
          categories: categoriesIds,
          platforms: platformsIds,
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

export async function signIn(email, password) {
  try {
    const session = await account.createEmailSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

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

export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
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

export async function getAllPlatforms() {
  try {
    const platforms = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.platformsCollectionId
    );

    return platforms.documents;
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

export async function getMovies() {
  try {
    const movies = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.showsCollectionId,
      [Query.equal("type", "movie")]
    );

    return movies.documents;
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    throw new Error("Failed to fetch movies.");
  }
}
export async function getSeries() {
  try {
    const series = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.showsCollectionId,
      [Query.equal("type", "series")]
    );

    return series.documents;
  } catch (error) {
    console.error("Error fetching series:", error.message);
    throw new Error("Failed to fetch series.");
  }
}

export async function searchShows(query) {
  try {
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.showsCollectionId,
      [Query.search("title", query)]
    );

    console.log("Raw search results:", result.documents);

    const uniqueShows = new Map();
    result.documents.forEach((show) => {
      console.log("Processing show:", show.title);
      if (!uniqueShows.has(show.title)) {
        uniqueShows.set(show.title, show);
      }
    });

    const uniqueArray = Array.from(uniqueShows.values());
    console.log("Filtered unique shows:", uniqueArray);
    return uniqueArray;
  } catch (error) {
    console.error("Error searching shows:", error);
    throw new Error("Failed to search shows.");
  }
}

export async function addToWatchlist(showId) {
  try {
    const session = await account.getSession("current");
    const userId = session.userId;

    if (!userId) {
      alert("Please log in to add shows to your watchlist.");
      return;
    }

    // Properly formatted query using Query.equal
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userShowProgressCollectionId,
      [Query.equal("user_id", userId), Query.equal("show_id", showId)]
    );

    if (response.documents.length > 0) {
      // Show is already in the watchlist, remove it
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userShowProgressCollectionId,
        response.documents[0].$id
      );
      alert("Show removed from your watchlist.");
    } else {
      // Show is not in the watchlist, add it
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userShowProgressCollectionId,
        "unique()",
        {
          user_id: userId,
          show_id: showId,
          watched: false,
          current_episode: 0,
        }
      );
      alert("Show added to your watchlist.");
    }
  } catch (error) {
    console.error("Error managing the watchlist:", error);
    alert("Error managing your watchlist.");
  }
}
