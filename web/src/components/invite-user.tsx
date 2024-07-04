import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppParams } from "@/hooks/useAppParams";
import { usePut } from "@/hooks/useFetch";
import { User, UserResponse } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { toast } from "./ui/use-toast";
import { getInitials } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

export function InviteUser() {
  const { selectedId } = useAppParams();
  const { data, trigger, isMutating } = usePut<UserResponse, { usernames: string[] }>(selectedId ? `/note/${selectedId}/invite` : null);
  const formSchema = z.object({
    username: z
      .string().min(1, 'Username is required').max(100).trim(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });


  async function inviteUser(values: z.infer<typeof formSchema>) {

    try {
      const response = await trigger({
        usernames: [values.username]
      });
      if (response) {
        toast({
          description: "User invitation sent"
        });
      }
    } catch (err) {
      let error = (err as any);
      if (error?.response?.data?.message) {
        toast({
          title: "Authentication",
          description: (error as any)?.response?.data?.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Authentication",
          description: "user invite failed, please try again",
          variant: "destructive",
        });
      }
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>
          Invite user
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <p>Invited users will be able to edit this note</p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(inviteUser)}
              className="grid w-full items-center gap-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl className="flex flex-col space-y-1.5">
                      <div>
                        <Input
                          className="border-[#59595980]"
                          type="text"
                          placeholder="username"
                          disabled={isMutating}
                          autoFocus
                          {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button disabled={isMutating} variant={"default"} type="submit">
                Continue
              </Button>
            </form>
          </Form>
        </div>
      </PopoverContent>
    </Popover>
  )
}


export function InviteAvatar({ name, username, isOwner }: User & { isOwner: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className="cursor-default">
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent className="p-3">
          <p>{`${name} (${username})`}</p>
          {isOwner ? <p className="text-gray-500 italic text-xs mt-1">Owner</p> : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

  )
}