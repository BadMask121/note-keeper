import { getUser } from "@/lib/storage";
import axios from "axios";
import useSWR from "swr";
import useSWRMutation from 'swr/mutation';
const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}`;

const headers = () => {
  const user = getUser()
  const userId = user?.id;
  return {
    user_id: userId
  }
}

const getRequest = (url: string) => axios.get(url, { headers: headers() }).then(res => res.data)
const postRequest = (url: string, data: any) => axios.post(url, data?.arg, { headers: headers() }).then(res => res.data)

export function useFetch<TResult>(url: string | null, fetch: (url: string) => Promise<any>) {
  return useSWR<TResult, any, string>(`${baseUrl}${url}`, fetch)
}

/**
 * Make http POST request
 * @param url 
 * @returns 
 */
export function usePost<TResult, TPayload = undefined>(url: string) {
  return useSWRMutation<TResult, undefined, string, TPayload>(`${baseUrl}${url}`, postRequest)
}

/**
 * Make http GET request
 * @param url 
 * @returns 
 */
export function useGet<TResult>(url: string | null,) {
  return useFetch<TResult>(url, getRequest)
}