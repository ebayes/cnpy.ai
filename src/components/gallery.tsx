// gallery.tsx

/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { FileInfo } from "./fileInfo";
import { ClassData } from "./classData";
import GalleryItem from "./galleryItem";

interface PhotoGalleryProps {
  images: FileInfo[];
  duplicates: ClassData[];
  markDeleted: (src: string) => void;
  moveToClass: (file: FileInfo | undefined) => void;
}

const PhotoGallery = (props: PhotoGalleryProps) => {
  
  const allImages = [...props.images];

  props.duplicates.forEach((dupe) => {
    allImages.push(...dupe.files);
  });

  const [selectedImage, setSelectedImage] = useState<FileInfo | undefined>(
    undefined
  );

  const openImage = (file: FileInfo) => {
    setSelectedImage(file);
  };

  const closeImage = () => {
    setSelectedImage(undefined);
  };

  

  return (
    <div>
      <div className="grid grid-cols-4 md:grid-cols-8 2xl:grid-cols-10 gap-4">
        {allImages.map((image) => (
          <GalleryItem
            image={image}
            key={image.src}
            openImage={openImage}
            markDeleted={props.markDeleted}
            moveToClass={props.moveToClass}
          />
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeImage}
        >
          <div className="bg-white p-2 rounded flex flex-col items-center">
            <img
              className="max-w-3xl max-h-[75%] max-w-[75%] cursor-pointer mb-1"
              src={selectedImage.src}
              alt="Selected"
            />
            <h3 className="font-semibold mb-2">{selectedImage.name}</h3>
            {selectedImage.classPredictions.length > 0 && (
              <table className="table-auto w-1/2">
                <thead>
                  <tr>
                    <th className="font-semibold text-sm text-left">Class</th>
                    <th className="font-semibold text-sm text-right">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedImage.classPredictions.map((prediction, index) => (
                    <>
                      {prediction.confidence > 0.05 && (
                        <tr key={index}>
                          <td className="text-sm py-1 text-left">
                            {prediction.class}
                          </td>
                          <td className="text-sm py-1 text-right">
                            {prediction.confidence.toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
