import { useState, useEffect } from "react";
import { SafeAreaView, View, ScrollView, Text } from "react-native";

import useAppwrite from "../../lib/useAppwrite";
import { getAllShows, getAllCategories } from "../../lib/appwrite";
import { SearchInput } from "../../components";
import MoviesCarousel from "../../components/MovieCarousel.jsx";

const Home = () => {
  const { data: shows } = useAppwrite(getAllShows);
  const { data: categories } = useAppwrite(getAllCategories);
  const [showsByCategory, setShowsByCategory] = useState({});
  console.log("shows by category", showsByCategory);

  useEffect(() => {
    if (shows && categories) {
      const categoryMap = categories.reduce((acc, category) => {
        acc[category.$id] = category.name; // Ensure that $id is the correct field
        return acc;
      }, {});

      console.log("Category Map:", categoryMap);

      const groupedShows = shows.reduce((acc, show) => {
        show.categories.forEach((categoryId) => {
          if (typeof categoryId === "object") {
            console.log(
              "Category ID is an object, expected a string or number:",
              categoryId
            );
            categoryId = categoryId.$id; // Assuming the object has an $id property
          }
          const categoryName = categoryMap[categoryId];
          if (categoryName) {
            if (!acc[categoryName]) {
              acc[categoryName] = [];
            }
            acc[categoryName].push(show);
          } else {
            console.warn("Missing category for ID:", categoryId);
          }
        });
        return acc;
      }, {});

      setShowsByCategory(groupedShows);
    }
  }, [shows, categories]);

  return (
    <SafeAreaView className="bg-primary flex-1">
      <View className="flex-1 px-4 py-6">
        <SearchInput />
        <ScrollView>
          {categories.map((category) => (
            <View key={category.$id} className="mb-6">
              <MoviesCarousel
                title={category.name}
                movies={showsByCategory[category.name] || []}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Home;
