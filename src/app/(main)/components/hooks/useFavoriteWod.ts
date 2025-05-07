import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation"; // Added
import { api } from "~/trpc/react";
import { useToast } from "~/components/ToastProvider";
import { useSession } from "~/lib/auth-client";
import type { WodWithMatches, Wod } from "~/types/wodTypes";

interface UseFavoriteWodProps {
  searchTerm?: string;
}

export function useFavoriteWod({ searchTerm }: UseFavoriteWodProps = {}) {
  const queryClient = useQueryClient();
  const router = useRouter(); // Added
  const utils = api.useUtils();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const isUserLoggedIn = !!session?.user;

  // Construct the correct query key for wod.getAll
  // This needs to match how api.wod.getAll.useQuery is called in WodViewer.tsx
  // and how it's hydrated in page.tsx
  // Manually construct the key to match tRPC's client-side structure: [pathPartsArray, inputObject]
  const getAllWodsQueryKey = [
    ["wod", "getAll"],
    { searchQuery: searchTerm || undefined },
  ];

  const addFavoriteMutation = api.favorite.add.useMutation({
    onMutate: async (variables: { wodId: string }) => {
      console.log(
        "[DEBUG useFavoriteWod] addFavorite onMutate - WodID:",
        variables.wodId,
      );
      console.log(
        "[DEBUG useFavoriteWod] addFavorite onMutate - getAllWodsQueryKey:",
        JSON.stringify(getAllWodsQueryKey),
      );

      await queryClient.cancelQueries({ queryKey: getAllWodsQueryKey });

      const previousWods = queryClient.getQueryData<WodWithMatches[] | Wod[]>(
        getAllWodsQueryKey,
      );
      console.log(
        "[DEBUG useFavoriteWod] addFavorite onMutate - previousWods count:",
        previousWods?.length,
      );

      if (previousWods) {
        queryClient.setQueryData<WodWithMatches[] | Wod[]>(
          getAllWodsQueryKey,
          previousWods.map((w: Wod | WodWithMatches): Wod | WodWithMatches => {
            if (w.id === variables.wodId) {
              console.log(
                `[DEBUG useFavoriteWod] addFavorite onMutate - Updating WOD ${w.id}, current isFavorited: ${w.isFavorited}`,
              );
              return { ...w, isFavorited: true };
            }
            return w;
          }),
        );
      }
      showToast("info", "Adding to favorites...");
      return { previousWods, queryKey: getAllWodsQueryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousWods && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousWods);
      }
      showToast("error", "Failed to add favorite");
    },
    onSuccess: (data, variables) => {
      showToast("success", "WOD added to favorites!");

      // Optimistic update for wod.getAll is handled in onMutate.
      // Now adding invalidation for wod.getAll for main page reliability.
      void utils.wod.getAll.invalidate({
        searchQuery: searchTerm || undefined,
      });

      // These lines for the favorites page are working and should remain:
      void utils.wod.getFavoritesByUser.invalidate({}); // Explicit input
      router.refresh(); // Restored for favorites page functionality
    },
    // onSettled is no longer needed for wod.getAll invalidation
  });

  const removeFavoriteMutation = api.favorite.remove.useMutation({
    onMutate: async (variables: { wodId: string }) => {
      console.log(
        "[DEBUG useFavoriteWod] removeFavorite onMutate - WodID:",
        variables.wodId,
      );
      console.log(
        "[DEBUG useFavoriteWod] removeFavorite onMutate - getAllWodsQueryKey:",
        JSON.stringify(getAllWodsQueryKey),
      );

      await queryClient.cancelQueries({ queryKey: getAllWodsQueryKey });
      const previousWods = queryClient.getQueryData<WodWithMatches[] | Wod[]>(
        getAllWodsQueryKey,
      );
      console.log(
        "[DEBUG useFavoriteWod] removeFavorite onMutate - previousWods count:",
        previousWods?.length,
      );

      if (previousWods) {
        queryClient.setQueryData<WodWithMatches[] | Wod[]>(
          getAllWodsQueryKey,
          previousWods.map((w: Wod | WodWithMatches): Wod | WodWithMatches => {
            if (w.id === variables.wodId) {
              console.log(
                `[DEBUG useFavoriteWod] removeFavorite onMutate - Updating WOD ${w.id}, current isFavorited: ${w.isFavorited}`,
              );
              return { ...w, isFavorited: false };
            }
            return w;
          }),
        );
      }
      showToast("info", "Removing from favorites...");
      return { previousWods, queryKey: getAllWodsQueryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousWods && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousWods);
      }
      showToast("error", "Failed to remove favorite");
    },
    onSuccess: (data, variables) => {
      showToast("success", "WOD removed from favorites!");

      // Optimistic update for wod.getAll is handled in onMutate.
      // Now adding invalidation for wod.getAll for main page reliability.
      void utils.wod.getAll.invalidate({
        searchQuery: searchTerm || undefined,
      });

      // These lines for the favorites page are working and should remain:
      void utils.wod.getFavoritesByUser.invalidate({}); // Explicit input
      router.refresh(); // Restored for favorites page functionality
    },
    // onSettled is no longer needed for wod.getAll invalidation
  });

  const handleToggleFavorite = (wodId: string, currentIsFavorited: boolean) => {
    if (!isUserLoggedIn) {
      showToast("error", "Please log in to manage favorites.");
      return;
    }
    if (currentIsFavorited) {
      removeFavoriteMutation.mutate({ wodId });
    } else {
      addFavoriteMutation.mutate({ wodId });
    }
  };

  return {
    handleToggleFavorite,
    isAddingFavorite: addFavoriteMutation.status === "pending",
    isRemovingFavorite: removeFavoriteMutation.status === "pending",
    // Expose isUserLoggedIn in case the component wants to use it directly from the hook
    // though WodListMobile already derives it.
    isUserLoggedIn,
  };
}
