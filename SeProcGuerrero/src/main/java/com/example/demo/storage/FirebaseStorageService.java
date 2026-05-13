package com.example.demo.storage;

import java.io.IOException;
import java.net.URL;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.modelo.Institucion;
import com.example.demo.service.SeguridadService;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service("storageService")
@Primary
public class FirebaseStorageService implements StorageService {

	private static final Set<String> ALLOWED = Set.of("image/png", "image/jpeg", "image/webp");

	private final SeguridadService seguridadService;

	public FirebaseStorageService(SeguridadService seguridadService) {
		this.seguridadService = seguridadService;
	}

	// Método auxiliar para obtener la carpeta raíz según el tenant
	private String obtenerPrefijoTenant() {
		Institucion inst = seguridadService.getInstitucionActual();
		if (inst != null && inst.getAbreviacion() != null && !inst.getAbreviacion().isBlank()) {
			return "institucion_" + inst.getAbreviacion().toLowerCase() + "/";
		}
		return "institucion_default/";
	}

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

		String folder = obtenerPrefijoTenant() + "usuarios/" + userId + "_" + safeUsername;
		String filename = folder + "/profile_" + UUID.randomUUID() + (ext.isBlank() ? "" : "." + ext);

		try {
			Bucket bucket = StorageClient.getInstance().bucket();
			bucket.create(filename, file.getInputStream(), file.getContentType());
			return filename;
		} catch (IOException e) {
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
		} catch (Exception e) {
			log.error("No se pudo eliminar el archivo anterior [{}]: {}", key, e.getMessage());
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

		URL signedUrl = blob.signUrl(1, TimeUnit.HOURS);
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

		String folder = obtenerPrefijoTenant() + "usuarios/" + userId + "_" + safeUsername + "/proyectos/" + idProyecto
				+ "/" + etapa;
		String filename = folder + "/reporte_" + UUID.randomUUID() + (ext.isBlank() ? "" : "." + ext);

		try {
			Bucket bucket = StorageClient.getInstance().bucket();
			bucket.create(filename, file.getInputStream(), file.getContentType());
			return filename;
		} catch (IOException e) {
			throw new RuntimeException("Error al subir el reporte a Firebase", e);
		}
	}
	
	@Override
	public String saveDocumentoInicialPdf(
	        Long userId,
	        String username,
	        Integer idSolicitud,
	        String tipoDocumento,
	        MultipartFile file) {

	    if (file == null || file.isEmpty()) {
	        throw new IllegalArgumentException("Archivo vacío.");
	    }

	    String contentType = file.getContentType();
	    String originalName = file.getOriginalFilename() == null
	            ? ""
	            : file.getOriginalFilename().toLowerCase();

	    boolean esPdf = "application/pdf".equalsIgnoreCase(contentType)
	            || originalName.endsWith(".pdf");

	    if (!esPdf) {
	        throw new IllegalArgumentException("Formato no permitido. Solo se aceptan archivos PDF.");
	    }

	    if (file.getSize() > 20 * 1024 * 1024) {
	        throw new IllegalArgumentException("El PDF no debe superar los 20MB.");
	    }

	    String safeUsername = sanitize(username);
	    String safeTipo = sanitize(tipoDocumento);
	    String ext = extension(file.getOriginalFilename());

	    if (ext.isBlank()) {
	        ext = "pdf";
	    }

	    String folder = obtenerPrefijoTenant()
	            + "usuarios/" + userId + "_" + safeUsername
	            + "/solicitudes/" + idSolicitud
	            + "/documentacion_inicial/" + safeTipo;

	    String filename = folder + "/documento_" + UUID.randomUUID() + "." + ext;

	    try {
	        Bucket bucket = StorageClient.getInstance().bucket();
	        bucket.create(filename, file.getInputStream(), "application/pdf");
	        return filename;
	    }
	    catch (IOException e) {
	        throw new RuntimeException("Error al subir documento inicial a Firebase", e);
	    }
	}

	@Override
	public String saveInstitutionLogo(String abreviacion, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Archivo vacío.");
		}
		if (!ALLOWED.contains(file.getContentType())) {
			throw new IllegalArgumentException("Formato no permitido. Usa PNG/JPG/WEBP.");
		}
		if (file.getSize() > 5 * 1024 * 1024) { // 5MB es más que suficiente para un logo
			throw new IllegalArgumentException("El logo no debe superar los 5MB.");
		}

		String ext = extension(file.getOriginalFilename());
		String safeAbreviacion = sanitize(abreviacion);

		// Carpeta exclusiva para los logos de la institución (ej. institucion_igife/logo/)
		String folder = "institucion_" + safeAbreviacion + "/logo";
		String filename = folder + "/logo_" + UUID.randomUUID() + (ext.isBlank() ? "" : "." + ext);

		try {
			Bucket bucket = StorageClient.getInstance().bucket();
			bucket.create(filename, file.getInputStream(), file.getContentType());
			return filename;
		}
		catch (IOException e) {
			throw new RuntimeException("Error al subir el logo a Firebase", e);
		}
	}

	@Override
	public String publicLogoUrl(String key) {
		if (key == null || key.isBlank()) {
			return "/assets/iconos/logoIgife.jpg"; // Fallback de seguridad
		}

		// Si en la base de datos detectamos que es tu ruta local antigua, la devolvemos tal cual.
		if (key.startsWith("/assets/")) {
			return key;
		}

		Bucket bucket = StorageClient.getInstance().bucket();
		Blob blob = bucket.get(key);

		if (blob == null) {
			return "/assets/iconos/logoIgife.jpg";
		}

		// Como es un logo (público), generamos una firma por 10 años (3650 días)
		URL signedUrl = blob.signUrl(3650, TimeUnit.DAYS);
		return signedUrl.toString();
	}

}