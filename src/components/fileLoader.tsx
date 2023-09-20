import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Resizer from "react-image-file-resizer";
import { FileInfo } from "./fileInfo";
import { Loader } from '@mantine/core';
import md5 from "md5";
import { IconUpload } from "@tabler/icons-react";

interface FileLoaderProps {
  setNewFiles: (files: FileInfo[]) => void;
}

const FileLoader = (props: FileLoaderProps) => {
  const [loading, setLoading] = useState(false);
  const [imgnum, setImgNum] = useState(0); 
  const [total, setTotal] = useState(0);

  const resizeFile = (file: File): Promise<File> =>
    new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        600,
        600,
        "JPEG",
        80,
        0,
        (uri) => {
          resolve(uri as File);
        },
        "file"
      );
    });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setLoading(true);
      setTotal(acceptedFiles.length); 
      setImgNum(0);
      for (const file of acceptedFiles) {
        const resizedFile = await resizeFile(file);
        const info: FileInfo = {
          name: file.name,
          src: URL.createObjectURL(resizedFile),
          hash: md5(resizedFile.name + resizedFile.size),
          embedding: null,
          toDelete: false,
          classPredictions: [],
        };
        props.setNewFiles([info]);
        setImgNum((prevImgNum) => prevImgNum + 1);
      }
      setLoading(false);
    },
    [props]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop,
  });

  return (
    <div id="upload" className="flex justify-center">
      <div
        {...getRootProps()}
        className="bg-[#3E63DD] justify-center w-32 text-sm text-white hover:bg-[#3451B2] flex rounded-md px-3 py-2 text-center cursor-pointer transition-all duration-200"
      >
        <input
          {...getInputProps()}
          className="hidden"
          type="file"
          name="file"
          id="file"
          multiple
        />
        {loading ? (
          <label id="loading" className="flex items-center justify-center">
            <Loader color="white" size="1rem" className="mr-2"/>
            {imgnum} / {total}
          </label>
        ) : (
          <label className="flex items-center justify-center">
            <IconUpload size="1rem" className="mr-2"/>
            Upload 
          </label>
        )}
      </div>
    </div>
  );
  
};

export default FileLoader;
