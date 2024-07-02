"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";

import { useGet } from "@/hooks/useFetch";
import { setUser } from "@/lib/storage";
import { UserResponse } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Label } from "./ui/label";

interface SignInCardProps {
  goToSignup: () => void
}

export default function SigninPage(props: SignInCardProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
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

  const username = form.getValues("username");
  const { mutate } = useGet<UserResponse>(username ? `/user/${username}` : null);

  async function signUser(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const response = await mutate();
        if (response) {
          setUser(response?.result);
          router.push("/note");
        }
        return
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
            description: "user creation failed, please try again",
            variant: "destructive",
          });
        }
      }
    });
  }

  return (
    <Card className="border-none bg-primary">
      <CardHeader className="text-center">
        <CardTitle>Access note</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(signUser)}
            className="grid w-full items-center gap-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl className="flex flex-col space-y-1.5">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        className="border-[#59595980]"
                        type="text"
                        placeholder="jhon-doe"
                        disabled={isPending}
                        autoFocus
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={isPending} variant={"default"} type="submit">
              Continue
            </Button>
          </form>
        </Form>
        <div className="flex justify-center flex-col items-center">
          <p className="text-gray-500">or</p>
          <Button onClick={props.goToSignup}>
            Create new user
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
