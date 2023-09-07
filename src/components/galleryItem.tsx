/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { FileInfo } from "./fileInfo";
import { IconEdit, IconRestore, IconTrash } from "@tabler/icons-react";

interface GalleryItemProps {
  image: FileInfo;
  markDeleted: (src: string) => void;
  openImage: (file: FileInfo) => void;
  moveToClass: (file: FileInfo | undefined) => void;
}

const GalleryItem = (props: GalleryItemProps) => {
  return (
    <div key={props.image.src} className="cursor-pointer relative">
      <img
        className={
          props.image.toDelete
            ? "object-cover h-48 w-full grayscale blur-[1px]"
            : "object-cover h-48 w-full"
        }
        src={props.image.src}
        alt=""
        onClick={() => props.openImage(props.image)}
      />

      <button
        onClick={() => {
          if (props.markDeleted) props.markDeleted(props.image.hash);
        }}
        className={
          props.image.toDelete
            ? "bg-red-500 text-white font-bold text-xs absolute top-0 right-0 mt-2 mr-2 w-5 h-5 flex items-center justify-center rounded-full"
            : "bg-red-500 text-white font-bold text-xs absolute top-0 right-0 mt-2 mr-2 w-5 h-5 flex items-center justify-center rounded-full"
        }
      >
        {props.image.toDelete ? (
          <IconRestore size="1rem"/>
        ) : (
          <IconTrash size="1rem"/>
        )}
      </button>
      <button
        onClick={() => {props.moveToClass(props.image);}}
        className="bg-blue-500 text-white font-bold text-xs absolute top-0 right-0 mt-8 mr-2 w-5 h-5 flex items-center justify-center rounded-full"
      >
        <IconEdit size="1rem"/>
      </button>
    </div>
  );
};

export default GalleryItem;
