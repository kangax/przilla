import { useQueryClient } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ToastProvider";
import { useSession } from "~/lib/auth-client";
import type { WodWithMatches, Wod } from "~/types/wodTypes";

interface UseFavoriteWodProps {
  searchTerm?: string;
}

export function useFavoriteWod({ searchTerm }: UseFavoriteWodProps = {}) {
  const queryClient = useQueryClient();
  const utils = api.useUtils();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const isUserLoggedIn = !!session?.user;

  const addFavoriteMutation = api.favorite.add.useMutation({
    onMutate: async (variables: { wodId: string }) => {
      const queryKey = [
        ["wod", "getAll"],
        { searchQuery: searchTerm || undefined },
      ];
      await queryClient.cancelQueries({ queryKey });
      const previousWods = queryClient.getQueryData<WodWithMatches[] | Wod[]>(
        queryKey,
      );

      if (previousWods) {
        queryClient.setQueryData<WodWithMatches[] | Wod[]>(
          queryKey,
          previousWods.map((w: Wod | WodWithMatches): Wod | WodWithMatches => {
            if (w.id === variables.wodId) {
              return { ...w, isFavorited: true };
            }
            return w;
          }),
        );
      }
      showToast("info", "Adding to favorites...");
      return { previousWods, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousWods && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousWods);
      }
      showToast("error", "Failed to add favorite");
    },
    onSuccess: () => {
      showToast("success", "WOD added to favorites!");
    },
    onSettled: () => {
      void utils.wod.getAll.invalidate({
        searchQuery: searchTerm || undefined,
      });
      void utils.wod.getFavoritesByUser.invalidate();
    },
  });

  const removeFavoriteMutation = api.favorite.remove.useMutation({
    onMutate: async (variables: { wodId: string }) => {
      const queryKey = [
        ["wod", "getAll"],
        { searchQuery: searchTerm || undefined },
      ];
      await queryClient.cancelQueries({ queryKey });
      const previousWods = queryClient.getQueryData<WodWithMatches[] | Wod[]>(
        queryKey,
      );

      if (previousWods) {
        queryClient.setQueryData<WodWithMatches[] | Wod[]>(
          queryKey,
          previousWods.map((w: Wod | WodWithMatches): Wod | WodWithMatches => {
            if (w.id === variables.wodId) {
              return { ...w, isFavorited: false };
            }
            return w;
          }),
        );
      }
      showToast("info", "Removing from favorites...");
      return { previousWods, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousWods && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousWods);
      }
      showToast("error", "Failed to remove favorite");
    },
    onSuccess: () => {
      showToast("success", "WOD removed from favorites!");
    },
    onSettled: () => {
      void utils.wod.getAll.invalidate({
        searchQuery: searchTerm || undefined,
      });
      void utils.wod.getFavoritesByUser.invalidate();
    },
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
