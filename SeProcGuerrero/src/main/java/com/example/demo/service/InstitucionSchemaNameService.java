package com.example.demo.service;

import java.text.Normalizer;
import java.util.Locale;

import org.springframework.stereotype.Service;

@Service
public class InstitucionSchemaNameService {
	
    public String generarSchemaDesdeAbreviacion(String abreviacion) {
        String base = abreviacion == null ? "institucion" : abreviacion.trim();

        String slug = Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");

        if (slug.isBlank()) {
            slug = "institucion";
        }

        if (!slug.matches("[a-z][a-z0-9_]*")) {
            slug = "inst_" + slug;
        }

        return "institucion_" + slug;
    }

}
