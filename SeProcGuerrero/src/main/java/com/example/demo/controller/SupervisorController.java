package com.example.demo.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.modelo.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.storage.StorageService;

@Controller
public class SupervisorController {

	private final UsuarioRepository usuarioRepo;

	private final StorageService storageService;

	private final PasswordEncoder passwordEncoder;

	public SupervisorController(UsuarioRepository usuarioRepo, StorageService storageService,
			PasswordEncoder passwordEncoder) {
		this.usuarioRepo = usuarioRepo;
		this.storageService = storageService;
		this.passwordEncoder = passwordEncoder;
	}

	@GetMapping("/supervisor")
	public String supervisor(Model model, Principal principal,
			@RequestParam(value = "view", required = false, defaultValue = "proyectos") String view) {

		String username = principal.getName();
		var usuario = usuarioRepo.findByUsername(username).orElse(null);

		if (usuario != null) {
			model.addAttribute("nombreUsuario", usuario.getNombre());
			String rol = (usuario.getRol() != null) ? usuario.getRol().getNombre() : "sin rol";
			model.addAttribute("rolUsuario", rol);
			model.addAttribute("fotoUrl", storageService.publicUrl(usuario.getFoto()));
		}
		else {
			model.addAttribute("nombreUsuario", username);
			model.addAttribute("rolUsuario", "sin rol");
			model.addAttribute("fotoUrl", null);
		}

		model.addAttribute("view", view);

		return "supervisor/supervisor";
	}

	// Cambiar contraseña del perfil logueado
	@PostMapping("/supervisor/perfil/password")
	@ResponseBody
	public ResponseEntity<?> cambiarPassword(@RequestBody Map<String, String> payload, Principal principal) {
		String username = principal.getName();
		Usuario usuario = usuarioRepo.findByUsername(username).orElse(null);

		if (usuario == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		String passActual = payload.get("passActual");
		String passNueva = payload.get("passNueva");

		// 1. Verificar que la contraseña actual ingresada coincida con la de la BD
		if (!passwordEncoder.matches(passActual, usuario.getPassword())) {
			return ResponseEntity.badRequest().body("La contraseña actual es incorrecta.");
		}

		// 2. Encriptar y guardar la nueva contraseña
		usuario.setPassword(passwordEncoder.encode(passNueva));
		usuarioRepo.save(usuario);

		return ResponseEntity.ok().build();
	}

	// Subir foto
	@PostMapping(value = "/supervisor/perfil/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseBody
	public ResponseEntity<?> subirFotoPerfil(@RequestParam("file") MultipartFile file, Principal principal) {

		String username = principal.getName();
		Usuario u = usuarioRepo.findByUsername(username).orElse(null);
		if (u == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		try {
			// borrar foto anterior si existe
			storageService.deleteIfExists(u.getFoto());

			String key = storageService.saveProfilePhoto(u.getIdUsuario(), u.getUsername(), file);
			u.setFoto(key);
			usuarioRepo.save(u);

			String url = storageService.publicUrl(key);
			return ResponseEntity.ok(Map.of("url", url));
		}
		catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
		catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No se pudo subir la foto.");
		}
	}

	@GetMapping("/supervisor/perfil/foto")
	@ResponseBody
	public ResponseEntity<?> obtenerFotoPerfil(Principal principal) {
		String username = principal.getName();
		Usuario u = usuarioRepo.findByUsername(username).orElse(null);

		if (u == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		String url = storageService.publicUrl(u.getFoto());
		if (url == null || url.isBlank()) {
			url = "/assets/iconos/sinFotoPerfil.png";
		}

		return ResponseEntity.ok(Map.of("url", url));
	}

	@DeleteMapping("/supervisor/perfil/foto")
	@ResponseBody
	public ResponseEntity<?> eliminarFotoPerfil(Principal principal) {
		String username = principal.getName();
		Usuario u = usuarioRepo.findByUsername(username).orElse(null);

		if (u != null && u.getFoto() != null) {
			storageService.deleteIfExists(u.getFoto());
			u.setFoto(null);
			usuarioRepo.save(u);
		}

		return ResponseEntity
			.ok(Map.of("message", "Foto eliminada correctamente", "url", "/assets/iconos/sinFotoPerfil.png"));
	}

}