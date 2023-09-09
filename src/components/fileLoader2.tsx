import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Resizer from "react-image-file-resizer";
import { FileInfo } from "./fileInfo";
import { Loader, Stack, ThemeIcon, Text } from '@mantine/core';
import md5 from "md5";
import { IconUpload } from "@tabler/icons-react";

interface FileLoaderProps {
  setNewFiles: (files: FileInfo[]) => void;
}

const FileLoader2 = (props: FileLoaderProps) => {
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
        className="justify-center flex rounded-lg px-6 py-4 text-center hover:bg-gray-100 cursor-pointer transition-all duration-200 border-dotted border-2 border-gray-300"
      >
        <input
          {...getInputProps()}
          className="hidden"
          type="file"
          name="file"
          id="file"
          multiple
        />
          <Stack align="center" justify="center" h={100} w={180}>
            <ThemeIcon variant="light" color="gray">
              <IconUpload size="1rem" />
            </ThemeIcon>
            <Text fz="sm" ta="center">Click <Text span c="blue" inherit>upload </Text>or drag and drop to add a new dataset</Text>
            </Stack>
      </div>
    </div> 
  );
  
};

export default FileLoader2;
