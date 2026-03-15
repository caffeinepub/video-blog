import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Principal } from "@icp-sdk/core/principal";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useAddFriend, useGetFriends } from "../hooks/useQueries";

export default function FriendsManager() {
  const [principalInput, setPrincipalInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const friendsQuery = useGetFriends();
  const addFriendMutation = useAddFriend();

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!principalInput.trim()) {
      setValidationError("Please enter a principal ID");
      return;
    }

    try {
      const principal = Principal.fromText(principalInput.trim());
      await addFriendMutation.mutateAsync(principal);
      setPrincipalInput("");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Cannot add yourself")) {
          setValidationError("You cannot add yourself as a friend");
        } else {
          setValidationError("Invalid principal ID format");
        }
      } else {
        setValidationError("Failed to add friend. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Friend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFriend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Friend's Principal ID</Label>
              <Input
                id="principal"
                type="text"
                placeholder="Enter principal ID..."
                value={principalInput}
                onChange={(e) => {
                  setPrincipalInput(e.target.value);
                  setValidationError("");
                }}
                disabled={addFriendMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Ask your friend for their principal ID to add them
              </p>
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {addFriendMutation.isSuccess && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Friend added successfully!
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={addFriendMutation.isPending}
              className="w-full gap-2"
            >
              {addFriendMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add Friend
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Friends ({friendsQuery.data?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friendsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : friendsQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>Failed to load friends list</AlertDescription>
            </Alert>
          ) : friendsQuery.data && friendsQuery.data.length > 0 ? (
            <div className="space-y-3">
              {friendsQuery.data.map((friend) => {
                const principalStr = friend.toString();
                const shortPrincipal = `${principalStr.slice(0, 8)}...${principalStr.slice(-6)}`;
                return (
                  <div
                    key={principalStr}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Avatar className="w-10 h-10 border-2 border-background">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm">
                        {principalStr.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {shortPrincipal}
                      </p>
                      <p className="text-xs text-muted-foreground">Friend</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No friends added yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add friends to see their photos
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
