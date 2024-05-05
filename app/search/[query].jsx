import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useAppwrite from "../../lib/useAppwrite";
import { searchShows } from "../../lib/appwrite";
import { EmptyState, SearchInput, MovieCard } from "../../components";

const Search = () => {
  const { query } = useLocalSearchParams();
  const { data: shows, refetch } = useAppwrite(() => searchShows(query));

  useEffect(() => {
    refetch();
  }, [query]);

  const [watchlist, setWatchlist] = useState(new Map());

  useEffect(() => {
    const watchlistMap = new Map();
    shows.forEach((movie) => {
      watchlistMap.set(movie.$id, movie.isInWatchlist);
    });
    setWatchlist(watchlistMap);
  }, [shows]);

  const handleWatchlistToggle = (id) => {
    setWatchlist(new Map(watchlist.set(id, !watchlist.get(id))));

    addToWatchlist(id);
  };
  console.log(shows);
  return (
    <SafeAreaView className="bg-black h-full">
      <FlatList
        data={shows}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 11,
        }}
        renderItem={({ item }) => (
          <MovieCard
            id={item.$id}
            title={item.title}
            description={item.description}
            image={item.image}
            rating={item.rating}
            year={item.year}
            numberOfEpisodes={item.numberOfEpisodes}
            categories={item.categories}
            platforms={item.platforms}
            type={item.type}
            isInWatchlist={watchlist.get(item.$id)}
            onWatchlistToggle={() => handleWatchlistToggle(item.$id)}
            className="mb-2"
          />
        )}
        numColumns={2}
        ListHeaderComponent={() => (
          <View className="flex w-full justify-items-start">
            <View className="flex mt-6 px-4">
              <Text className="font-medium text-gray-100 text-sm">
                Search Results
              </Text>
              <Text className="text-2xl font-psemibold text-white mt-1">
                {query}
              </Text>

              <View className="mt-6 mb-6 w-[280px]">
                <SearchInput initialQuery={query} refetch={refetch} />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Shows Found"
            subtitle="No shows found for this search query"
          />
        )}
      />
    </SafeAreaView>
  );
};

export default Search;
