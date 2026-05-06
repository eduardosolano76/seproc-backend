package com.example.demo.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

	String saveProfilePhoto(Long userId, String username, MultipartFile file);

	void deleteIfExists(String key);

	String publicUrl(String key); // construye la URL pública

	String saveReporteImagen(Long userId, String username, Integer idProyecto, String etapa, MultipartFile file);

	String saveInstitutionLogo(String abreviacion, MultipartFile file);

	String publicLogoUrl(String key);

}
