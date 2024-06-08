import React, { useState, useEffect } from "react";
import { View, FlatList, Dimensions, Text } from "react-native";
import MovieCard from "./MovieCard.jsx";
import { cn } from "../lib/utils.js";
import { useGlobalContext } from "../context/GlobalProvider";

const { width: viewportWidth } = Dimensions.get("window");

const MoviesCarousel = ({ title, movies, className }) => {
  const { addToWatchlist } = useGlobalContext();
  const [watchlist, setWatchlist] = useState(new Map());

  useEffect(() => {
    const watchlistMap = new Map();
    movies.forEach((movie) => {
      watchlistMap.set(movie.$id, movie.isInWatchlist);
    });
    setWatchlist(watchlistMap);
  }, [movies]);

  const handleWatchlistToggle = (id) => {
    setWatchlist(new Map(watchlist.set(id, !watchlist.get(id))));
    addToWatchlist(id);
  };

  const renderItem = ({ item }) => (
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
      className="mr-2"
    />
  );

  return (
    <View className={cn("w-full bg-[#121212] rounded-xl py-2", className)}>
      <View className="flex flex-row ml-4 mb-5 mt-3">
        <View className="w-1 bg-[#f5c518] rounded-md mr-2" />
        <Text className="text-white font-bold text-[20px]">{title}</Text>
      </View>
      <FlatList
        data={movies}
        renderItem={renderItem}
        keyExtractor={(item) => item.$id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToAlignment="center"
        decelerationRate="fast"
        pagingEnabled
        snapToInterval={viewportWidth}
        className="pl-4"
      />
    </View>
  );
};

export default MoviesCarousel;
