import React, { useState } from "react";
import { View, Text, Image, ScrollView } from "react-native";
import { Dialog } from "@rneui/themed";
import stars from "../assets/icons/star.png";
import { Button } from "@rneui/base";
const CustomModal = ({
  title = "",
  description = "",
  image = "",
  rating = "",
  year = "",
  numberOfEpisodes = 0,
  type = "",
  categories = [],
  platforms = [],
}) => {
  const [visible, setVisible] = useState(false);

  const toggleDialog = () => {
    setVisible(!visible);
  };

  return (
    <View>
      <Button
        containerStyle={{}}
        title="More details"
        type="clear"
        className="text-sm"
        titleStyle={{ color: "white", fontSize: 12 }}
        onPress={toggleDialog}
      />

      <View className="flex-1 items-center justify-center">
        <Dialog
          isVisible={visible}
          onBackdropPress={toggleDialog}
          className
          overlayStyle={{
            backgroundColor: "#1f1f1f",
            padding: "0px",
          }}>
          <ScrollView className="bg-[#1f1f1f] p-6 rounded-lg">
            <View className="flex-row mb-3">
              <Image
                source={{
                  uri: image,
                }}
                resizeMode="contain"
                className="w-[74px] h-[104px] mr-2"
              />
              <View className="flex-1">
                <Text className="text-white text-xl">{title}</Text>
                <View className="flex-row flex-wrap items-center">
                  <Text className="text-gray-400">{year}</Text>
                  <Text className="text-gray-400">
                    {type == "movie" ? "" : ` · ${numberOfEpisodes} episodes`}
                  </Text>
                </View>
                <Text className="text-gray-400">
                  {categories.map((category, index) => (
                    <Text key={index}>
                      {index > 0 && " · "}
                      {category.name}
                    </Text>
                  ))}
                </Text>
                <View className="flex-row items-center">
                  {/* Ensure you have a suitable star icon image in your assets */}
                  <Image
                    className="w-3 h-3 tintColor-[#f5c518]"
                    source={stars}
                  />
                  <Text className="text-[#FFFFFFB3] text-lg">{rating}</Text>
                </View>
              </View>
            </View>
            <Text className="text-white mb-3">{description}</Text>
            <Text className="text-gray-400 mt-3 mb-1.5">Available on:</Text>
            <View className="flex-row flex-wrap gap-2">
              {platforms.length > 0 ? (
                platforms.map((platform, index) => (
                  <Text
                    key={index}
                    className="text-white bg-[#FFFFFF14] px-2 py-1 rounded-lg text-center text-xs">
                    {platform.name}
                  </Text>
                ))
              ) : (
                <Text className="text-white">
                  Currently not available on any platform.
                </Text>
              )}
            </View>
          </ScrollView>
        </Dialog>
      </View>
    </View>
  );
};

export default CustomModal;
