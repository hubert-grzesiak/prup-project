import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import { View, Text, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "../constants";
import { CustomButton, Loader } from "../components";
import { useGlobalContext } from "../context/GlobalProvider";

const Welcome = () => {
  const { isLoading, isLoggedIn } = useGlobalContext();

  if (!isLoading && isLoggedIn) return <Redirect href="/series" />;

  return (
    <SafeAreaView className="bg-black h-full">
      <Loader isLoading={isLoading} />

      <ScrollView
        contentContainerStyle={{
          height: "100%",
        }}>
        <View className="w-full flex justify-center items-center h-full px-4">
          <Image
            source={images.logo}
            className="w-[130px] h-[84px]"
            resizeMode="contain"
          />

          <View className="relative mt-5">
            <Text className="text-3xl text-white font-bold text-center">
              Discover your favourite movies and series with {"\n"}
              <Text className="text-secondary-200">WatchList</Text>
            </Text>
          </View>

          <CustomButton
            title="Continue with Email"
            handlePress={() => router.push("/sign-in")}
            containerStyles="w-full mt-7"
          />
        </View>
      </ScrollView>

      <StatusBar backgroundColor="#161622" style="light" />
    </SafeAreaView>
  );
};

export default Welcome;
