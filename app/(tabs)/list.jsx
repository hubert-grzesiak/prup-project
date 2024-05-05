import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Button,
} from "react-native";
import SegmentedControlTab from "react-native-segmented-control-tab";
import { getList, updateEpisodeCount } from "../../lib/appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import debounce from "lodash.debounce";

export default function List() {
  const [listItems, setListItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredItems, setFilteredItems] = useState([]); // Declare the state for filtered items

  useEffect(() => {
    const fetchData = async () => {
      const items = await getList();
      setListItems(items);
    };
    fetchData();
  }, []);

  const handleIndexChange = (index) => {
    setSelectedIndex(index);
  };

  const debouncedUpdateEpisodeCount = useCallback(
    debounce(async (docId, change, itemIndex) => {
      try {
        await updateEpisodeCount(docId, change);
      } catch (error) {
        console.error("Failed to update episode count:", error);
        alert("Failed to update episode count. Please try again.");
      }
    }, 500),
    []
  ); // Debounce time of 500ms

  const handleEpisodeChange = (itemIndex, change) => {
    const currentItem = listItems[itemIndex];
    const newEpisodeCount = Math.max(0, currentItem.current_episode + change);

    // Optimistically update the UI
    const updatedListItems = [...listItems];
    updatedListItems[itemIndex] = {
      ...currentItem,
      current_episode: newEpisodeCount,
    };
    setListItems(updatedListItems);

    // Call the debounced update function
    debouncedUpdateEpisodeCount(currentItem.$id, change, itemIndex);
  };

  useEffect(() => {
    // Filter items based on selected tab index
    const filtered = listItems.filter((item) => {
      switch (selectedIndex) {
        case 0: // Currently Watching
          return (
            item.current_episode > 0 &&
            item.current_episode < item.showDetails.numberOfEpisodes
          );
        case 1: // Plan to Watch
          return item.current_episode === 0;
        case 2: // Completed
          return item.current_episode === item.showDetails.numberOfEpisodes;
        case 3: // All Shows
        default:
          return true;
      }
    });
    setFilteredItems(filtered); // Update the state with the filtered results
  }, [listItems, selectedIndex]);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-black">
      <SegmentedControlTab
        values={["Currently", "Plan to Watch", "Completed", "All Shows"]}
        selectedIndex={selectedIndex}
        onTabPress={handleIndexChange}
        tabStyle={{
          backgroundColor: "#1a1a1a",
          borderColor: "#000",
        }}
        activeTabStyle={{ backgroundColor: "#1a1a1a" }}
        tabTextStyle={{ color: "gray", paddingTop: 3, paddingBottom: 3 }}
      />
      <ScrollView className="flex flex-col gap-2 mt-2">
        {filteredItems.map((item, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 10,
              alignItems: "center",
              backgroundColor: "#1a1a1a",
            }}>
            <View className="flex flex-row items-center gap-3">
              <Image
                source={{
                  uri:
                    item.showDetails.image ||
                    "https://i.ebayimg.com/images/g/ViAAAOSwn-Nlzmtp/s-l1600.jpg",
                }}
                className="w-[50px] h-[50px] rounded-md"
              />
              <View className="w-[150px]">
                <Text className="text-white">
                  {item.showDetails.title || "No Title"}
                </Text>
              </View>
            </View>
            <Text className="text-white">
              {item.current_episode} / {item.showDetails.numberOfEpisodes}
            </Text>
            <TouchableOpacity
              onPress={() => handleEpisodeChange(i, 1)}
              disabled={
                item.current_episode >= item.showDetails.numberOfEpisodes
              }
              style={{
                backgroundColor:
                  item.current_episode >= item.showDetails.numberOfEpisodes
                    ? "gray"
                    : "#6ffd6a94",
                padding: 10,
                borderRadius: "100%",
                width: 35,
                height: 35,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Text style={{ color: "#fff" }}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleEpisodeChange(i, -1)}
              disabled={item.current_episode === 0}
              style={{
                backgroundColor:
                  item.current_episode === 0 ? "gray" : "#ea5e5ec3",
                padding: 10,
                borderRadius: "100%",
                width: 35,
                height: 35,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Text style={{ color: "#fff" }}>-</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
