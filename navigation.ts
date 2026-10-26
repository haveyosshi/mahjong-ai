export function useRouter(){return {push:(path:string)=>{location.hash=path},replace:(path:string)=>{location.replace('#'+path)}}}
