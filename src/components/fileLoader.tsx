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
        className="bg-green-500 text-sm text-white hover:bg-green-600 flex rounded-md px-3 py-2 text-center hover:bg-gray-200 cursor-pointer transition-all duration-200"
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
          <label className="flex items-center justify-center">
            <Loader color="white" size="1rem" className="mr-2"/>
            Upload Images
          </label>
        ) : (
          <label className="flex items-center justify-center">
            <IconUpload size="1rem" className="mr-2"/>
            Upload Images
          </label>
        )}
      </div>
    </div>
  );
  
};

export default FileLoader;
