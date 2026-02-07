const PROD_URL = 'https://talentearthstudios.vercel.app/api';
const LOCAL_URL = 'http://192.168.4.40:3000/api';

export const API_URL = __DEV__ ? LOCAL_URL : PROD_URL;
