import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, View, Text, TouchableOpacity, Image } from "react-native";
import SegmentedControlTab from "react-native-segmented-control-tab";
import { getList, updateEpisodeCount } from "../../lib/appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import debounce from "lodash.debounce";
import * as Haptics from "expo-haptics";

export default function List() {
  const [listItems, setListItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const latestListItemsRef = useRef(listItems);
  const updateQueue = useRef({});

  useEffect(() => {
    latestListItemsRef.current = listItems;
  }, [listItems]);

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
    debounce(async () => {
      const updates = Object.values(updateQueue.current);
      updateQueue.current = {};

      try {
        await Promise.all(
          updates.map(({ docId, cumulativeChange }) =>
            updateEpisodeCount(docId, cumulativeChange)
          )
        );
        const updatedItems = await getList();
        setListItems(updatedItems);
      } catch (error) {
        console.error("Failed to update episode count:", error);
        alert("Failed to update episode count. Please try again.");
      }
    }, 500),
    []
  );

  const handleEpisodeChange = (itemIndex, change) => {
    const currentItem = latestListItemsRef.current[itemIndex];
    const newEpisodeCount = Math.max(0, currentItem.current_episode + change);

    const updatedListItems = [...latestListItemsRef.current];
    updatedListItems[itemIndex] = {
      ...currentItem,
      current_episode: newEpisodeCount,
    };
    setListItems(updatedListItems);

    if (!updateQueue.current[currentItem.$id]) {
      updateQueue.current[currentItem.$id] = {
        docId: currentItem.$id,
        cumulativeChange: 0,
      };
    }

    updateQueue.current[currentItem.$id].cumulativeChange += change;

    debouncedUpdateEpisodeCount();
  };

  const filterItems = (items, index) => {
    switch (index) {
      case 0: // Currently Watching
        return items.filter(
          (item) =>
            item.current_episode > 0 &&
            item.current_episode < item.showDetails.numberOfEpisodes
        );
      case 1: // All Shows
        return items.sort((a, b) => {
          if (a.current_episode === 0) return -1;
          if (b.current_episode === 0) return 1;
          if (a.current_episode === a.showDetails.numberOfEpisodes) return 1;
          if (b.current_episode === b.showDetails.numberOfEpisodes) return -1;
          return a.current_episode - b.current_episode;
        });
      default:
        return items;
    }
  };

  const filteredItems = filterItems(listItems, selectedIndex);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-black pb-0">
      <SegmentedControlTab
        values={["Currently", "All Shows"]}
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleEpisodeChange(i, 1);
              }}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleEpisodeChange(
                  i,
                  item.showDetails.numberOfEpisodes - item.current_episode
                );
              }}
              disabled={
                selectedIndex !== 1 &&
                item.current_episode >= item.showDetails.numberOfEpisodes
              }
              style={{
                backgroundColor:
                  item.current_episode >= item.showDetails.numberOfEpisodes
                    ? "gray"
                    : "#6ffd6a94",
                padding: 10,
                borderRadius: 100,
                width: 35,
                height: 35,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Text style={{ color: "#fff" }}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleEpisodeChange(i, -1);
              }}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleEpisodeChange(i, -item.current_episode);
              }}
              disabled={selectedIndex !== 1 && item.current_episode === 0}
              style={{
                backgroundColor:
                  item.current_episode === 0 ? "gray" : "#ea5e5ec3",
                padding: 10,
                borderRadius: 100,
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
