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
const putRequest = (url: string, data: any) => axios.put(url, data?.arg, { headers: headers() }).then(res => res.data)

export function useFetch<TResult>(url: string | null, fetch: (url: string) => Promise<any>) {
  return useSWR<TResult, any, string | null>(url ? `${baseUrl}${url}` : null, fetch)
}

/**
 * perform http POST request
 * @param url 
 * @returns 
 */
export function usePost<TResult, TPayload = undefined>(url: string | null) {
  return useSWRMutation<TResult, undefined, string | null, TPayload>(url ? `${baseUrl}${url}` : null, postRequest)
}

/**
 * perform http PUT request
 * @param url
 * @returns
 */
export function usePut<TResult, TPayload = undefined>(url: string | null) {
  return useSWRMutation<TResult, undefined, string | null, TPayload>(url ? `${baseUrl}${url}` : null, putRequest)
}

/**
 * perform http GET request
 * @param url 
 * @returns 
 */
export function useGet<TResult>(url: string | null,) {
  return useFetch<TResult>(url, getRequest)
}