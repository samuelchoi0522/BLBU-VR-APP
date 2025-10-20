package com.blbu.BLBU_VR_APP_SERVICE.util;

import java.io.*;
import java.util.zip.GZIPOutputStream;
import java.util.zip.GZIPInputStream;

public class VideoCompressor {

    public static File compress(File inputFile) throws IOException {
        File compressedFile = new File(inputFile.getParent(), inputFile.getName() + ".gz");
        try (FileInputStream fis = new FileInputStream(inputFile);
             GZIPOutputStream gos = new GZIPOutputStream(new FileOutputStream(compressedFile))) {
            fis.transferTo(gos);
        }
        return compressedFile;
    }

    public static File decompress(File compressedFile) throws IOException {
        String outputFileName = compressedFile.getName().replace(".gz", "");
        File outputFile = new File(compressedFile.getParent(), outputFileName);
        try (GZIPInputStream gis = new GZIPInputStream(new FileInputStream(compressedFile));
             FileOutputStream fos = new FileOutputStream(outputFile)) {
            gis.transferTo(fos);
        }
        return outputFile;
    }
}