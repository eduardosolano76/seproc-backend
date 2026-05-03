package com.example.demo.storage;

import java.io.IOException;
import java.net.URL;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;

@Service
@Primary
public class FirebaseStorageService implements StorageService {

	private static final Set<String> ALLOWED = Set.of("image/png", "image/jpeg", "image/webp");

	@Override
	public String saveProfilePhoto(Long userId, String username, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Archivo vacío.");
		}
		if (!ALLOWED.contains(file.getContentType())) {
			throw new IllegalArgumentException("Formato no permitido. Usa PNG/JPG/WEBP.");
		}
		if (file.getSize() > 10 * 1024 * 1024) {
			throw new IllegalArgumentException("Máximo 10MB.");
		}

		String ext = extension(file.getOriginalFilename());
		String safeUsername = sanitize(username);

		String folder = "usuarios/" + userId + "_" + safeUsername;
		String filename = folder + "/profile_" + UUID.randomUUID() + (ext.isBlank() ? "" : "." + ext);

		try {
			Bucket bucket = StorageClient.getInstance().bucket();
			bucket.create(filename, file.getInputStream(), file.getContentType());
			return filename;
		}
		catch (IOException e) {
			throw new RuntimeException("Error al subir imagen a Firebase", e);
		}
	}

	@Override
	public void deleteIfExists(String key) {
		if (key == null || key.isBlank())
			return;

		try {
			Bucket bucket = StorageClient.getInstance().bucket();
			Blob blob = bucket.get(key);
			if (blob != null) {
				blob.delete();
			}
		}
		catch (Exception e) {
			System.err.println("No se pudo eliminar el archivo anterior: " + e.getMessage());
		}
	}

	@Override
	public String publicUrl(String key) {
		if (key == null || key.isBlank())
			return null;

		Bucket bucket = StorageClient.getInstance().bucket();
		Blob blob = bucket.get(key);

		if (blob == null) {
			return null;
		}

		URL signedUrl = blob.signUrl(3650, TimeUnit.DAYS);
		return signedUrl.toString();
	}

	private String extension(String name) {
		if (name == null)
			return "";
		int idx = name.lastIndexOf('.');
		if (idx < 0)
			return "";
		return name.substring(idx + 1).toLowerCase();
	}

	private String sanitize(String value) {
		if (value == null || value.isBlank())
			return "sin_usuario";
		return value.trim().toLowerCase().replaceAll("[^a-z0-9_-]", "_");
	}

	@Override
	public String saveReporteImagen(Long userId, String username, Integer idProyecto, String etapa,
			MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Archivo vacío.");
		}

		if (!ALLOWED.contains(file.getContentType())) {
			throw new IllegalArgumentException("Formato no permitido. Solo se aceptan imágenes (PNG, JPG, WEBP).");
		}

		if (file.getSize() > 20 * 1024 * 1024) {
			throw new IllegalArgumentException("La imagen no debe superar los 20MB.");
		}

		String safeUsername = sanitize(username);

		String ext = extension(file.getOriginalFilename());

		String folder = "usuarios/" + userId + "_" + safeUsername + "/proyectos/" + idProyecto + "/" + etapa;
		String filename = folder + "/reporte_" + UUID.randomUUID() + (ext.isBlank() ? "" : "." + ext);

		try {
			Bucket bucket = StorageClient.getInstance().bucket();
			bucket.create(filename, file.getInputStream(), file.getContentType());
			return filename;
		}
		catch (IOException e) {
			throw new RuntimeException("Error al subir el reporte a Firebase", e);
		}
	}

}