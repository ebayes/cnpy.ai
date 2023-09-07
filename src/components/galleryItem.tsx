// galleryItem.tsx

/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { FileInfo } from "./fileInfo";
import { IconEdit, IconRestore, IconTrash } from "@tabler/icons-react";
import { Badge, Text } from "@mantine/core";

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
        onClick={() => props.openImage(props.image)}
      />
<div id="namebuttons" className="flex justify-between items-center w-full pt-1">
  <Text id="filename" size="xs" className="flex-grow" truncate>
    {props.image.name}
  </Text>

  <div className="flex gap-2">


    {props.image.classPredictions && props.image.classPredictions.length > 0 && props.image.classPredictions[0].class && (
  <>
    <button
      onClick={() => {props.moveToClass(props.image);}}
      className="bg-blue-500 text-white w-5 h-5 flex items-center justify-center rounded-full"
    >
      <IconEdit size="0.8rem"/>
    </button>
  </>
)}


    <button
      onClick={() => {
        if (props.markDeleted) props.markDeleted(props.image.hash);
      }}
      className={
        props.image.toDelete
          ? "bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full"
          : "bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full"
      }
    >
      {props.image.toDelete ? (
        <IconRestore size="0.8rem"/>
      ) : (
        <IconTrash size="0.8rem"/>
      )}
    </button>
  </div>
</div>

{props.image.classPredictions && props.image.classPredictions.length > 0 && props.image.classPredictions[0].class && (
  <Badge id="badgeclass" key={0} size="xs" className="mr-2">
    {props.image.classPredictions[0].class}
  </Badge>
)}



    </div>
  );
};

export default GalleryItem;
