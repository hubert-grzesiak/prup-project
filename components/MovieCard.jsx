import React from "react";
import { Image, TouchableOpacity, View, Text } from "react-native";
import { useGlobalContext } from "../context/GlobalProvider";
import CustomModal from "./CustomModal.jsx";
import { cn } from "../lib/utils.js";

const MovieCard = ({
  title = "",
  description = "",
  image = "",
  id,
  genre = "",
  rating = "",
  year = "",
  numberOfEpisodes = 0,
  platform = "",
  type = "",
  isInWatchlist = false,
  onWatchlistToggle,
  categories = [],
  platforms = [],
  className,
}) => {
  return (
    <View
      className={cn(
        "bg-[#1a1a1a] mr-3 rounded-b-xs relative max-w-[133px] rounded-b-lg",
        className
      )}>
      <View className="object-contain w-[133px] h-[197px] overflow-hidden">
        <Image
          source={{ uri: image }}
          resizeMode="contain"
          className="object-contain w-[133px] h-[197px] scale-105"
        />
      </View>
      <View className="px-2 py-2.5">
        <View className="flex flex-row items-center mb-1 gap-1">
          <Text className="text-orange-300 font-semibold text-opacity-70">
            {rating}
          </Text>
          <Text className="text-[10px]">⭐</Text>
        </View>
        <View className="mb-3 w-[115px] h-[30px] truncate">
          <Text className="text-white text-base">{title}</Text>
        </View>
        <TouchableOpacity
          onPress={onWatchlistToggle}
          className="bg-[#FFFFFF14] py-2 rounded-xs items-center justify-center">
          <Text className="text-blue-400">
            {isInWatchlist ? "Watchlist -" : "Watchlist +"}
          </Text>
        </TouchableOpacity>
        <CustomModal
          title={title}
          description={description}
          image={image}
          rating={rating}
          year={year}
          numberOfEpisodes={numberOfEpisodes}
          type={type}
          platform={platform}
          genre={genre}
          isInWatchlist={isInWatchlist}
          categories={categories}
          platforms={platforms}
        />
      </View>
    </View>
  );
};

export default MovieCard;
