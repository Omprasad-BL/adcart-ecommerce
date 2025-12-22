import ImageKit from "imagekit";
export const imageKit = new ImageKit({
  urlEndpoint: process.env.IMAGE_KIT_URL_ENDPOINT,
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY
});

export default imageKit;