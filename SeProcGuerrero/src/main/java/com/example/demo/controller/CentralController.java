package com.example.demo.controller;

import java.security.Principal;
import java.util.List;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.modelo.Institucion;
import com.example.demo.modelo.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.SeguridadService;
import com.example.demo.storage.StorageService;

@Controller
public class CentralController {

	private final UsuarioRepository usuarioRepo;
	private final StorageService storageService;
	private final PasswordEncoder passwordEncoder;
	private final SeguridadService seguridadService;

	public CentralController(UsuarioRepository usuarioRepo, StorageService storageService,
			PasswordEncoder passwordEncoder, SeguridadService seguridadService) {
		this.usuarioRepo = usuarioRepo;
		this.storageService = storageService;
		this.passwordEncoder = passwordEncoder;
		this.seguridadService = seguridadService;
	}

	@GetMapping("/central")
	public String central(Model model, Principal principal,
			@RequestParam(value = "view", required = false, defaultValue = "solicitudes") String view,
			@RequestHeader(value = "X-Requested-With", required = false) String requestedWith) {

		String username = principal.getName();
		var usuario = usuarioRepo.findByUsername(username).orElse(null);

		if (usuario != null) {
			model.addAttribute("nombreUsuario", usuario.getNombre());
			String rol = (usuario.getRol() != null) ? usuario.getRol().getNombre() : "sin rol";
			model.addAttribute("rolUsuario", rol);
			model.addAttribute("fotoUrl", storageService.publicUrl(usuario.getFoto()));

			// Pasamos los datos de la institución a la vista para que el menú lateral
			// cargue su logo
			Institucion miInstitucion = usuario.getInstitucion();
			if (miInstitucion != null) {
			    model.addAttribute("logoEmpresa", storageService.publicLogoUrl(miInstitucion.getLogoUrl()));
			    model.addAttribute("nombreEmpresa", miInstitucion.getAbreviacion());
			}
			else {
				model.addAttribute("logoEmpresa", "/assets/iconos/logoIgife.jpg"); // Fallback
																					// de
																					// seguridad
				model.addAttribute("nombreEmpresa", "SEPROC");
			}

		}
		else {
			model.addAttribute("nombreUsuario", username);
			model.addAttribute("rolUsuario", "sin rol");
			model.addAttribute("fotoUrl", null);
			model.addAttribute("logoEmpresa", "/assets/iconos/logoIgife.jpg");
			model.addAttribute("nombreEmpresa", "SEPROC");
		}

		model.addAttribute("view", view);

		List<Usuario> usuarios = List.of();
		Institucion miInstitucion = seguridadService.getInstitucionActual();

		if (miInstitucion != null) {
			switch (view) {
				case "usuarios-supervisores":
					usuarios = usuarioRepo.findByInstitucionAndActivoTrueAndRol_NombreIgnoreCase(
							miInstitucion, "supervisor");
					break;
				case "usuarios-constructores":
					usuarios = usuarioRepo.findByInstitucionAndActivoTrueAndRol_NombreIgnoreCase(
							miInstitucion, "contratista");
					break;
				case "usuarios-directores":
					usuarios = usuarioRepo.findByInstitucionAndActivoTrueAndRol_NombreIgnoreCase(
							miInstitucion, "direccion");
					break;
				default:
					break;
			}
		}

		model.addAttribute("usuarios", usuarios);

		boolean isAjax = "XMLHttpRequest".equalsIgnoreCase(requestedWith);
		if (isAjax && view != null && view.startsWith("usuarios-")) {
			return "central/_usuarios :: usuariosContent";
		}

		return "central/central";
	}

	@PostMapping("/central/perfil/password")
	@ResponseBody
	public ResponseEntity<?> cambiarPassword(@RequestBody Map<String, String> payload, Principal principal) {
		String username = principal.getName();
		Usuario usuario = usuarioRepo.findByUsername(username).orElse(null);

		if (usuario == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		String passActual = payload.get("passActual");
		String passNueva = payload.get("passNueva");

		if (passActual == null || passActual.isBlank() || passNueva == null || passNueva.isBlank()) {
			return ResponseEntity.badRequest().body("Todos los campos son obligatorios.");
		}

		if (!passwordEncoder.matches(passActual, usuario.getPassword())) {
			return ResponseEntity.badRequest().body("La contraseña actual es incorrecta.");
		}

		if (passwordEncoder.matches(passNueva, usuario.getPassword())) {
			return ResponseEntity.badRequest().body("La nueva contraseña no puede ser igual a la actual.");
		}

		usuario.setPassword(passwordEncoder.encode(passNueva));
		usuarioRepo.save(usuario);

		return ResponseEntity.ok().build();
	}

	@PostMapping(value = "/central/perfil/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseBody
	public ResponseEntity<?> subirFotoPerfil(@RequestParam("file") MultipartFile file, Principal principal) {

		String username = principal.getName();
		Usuario usuario = usuarioRepo.findByUsername(username).orElse(null);

		if (usuario == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		try {
			storageService.deleteIfExists(usuario.getFoto());

			String key = storageService.saveProfilePhoto(usuario.getIdUsuario(), usuario.getUsername(), file);
			usuario.setFoto(key);
			usuarioRepo.save(usuario);

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

	@GetMapping("/central/perfil/foto")
	@ResponseBody
	public ResponseEntity<?> obtenerFotoPerfil(Principal principal) {
		String username = principal.getName();
		Usuario usuario = usuarioRepo.findByUsername(username).orElse(null);

		if (usuario == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		String url = storageService.publicUrl(usuario.getFoto());
		if (url == null || url.isBlank()) {
			url = "/assets/iconos/sinFotoPerfil.png";
		}

		return ResponseEntity.ok(Map.of("url", url));
	}

	// Eliminar foto de perfil
	@DeleteMapping("/central/perfil/foto")
	@ResponseBody
	public ResponseEntity<?> eliminarFotoPerfil(Principal principal) {
		String username = principal.getName();
		Usuario usuario = usuarioRepo.findByUsername(username).orElse(null);

		if (usuario != null && usuario.getFoto() != null) {
			storageService.deleteIfExists(usuario.getFoto());
			usuario.setFoto(null);
			usuarioRepo.save(usuario);
		}

		return ResponseEntity
			.ok(Map.of("message", "Foto eliminada correctamente", "url", "/assets/iconos/sinFotoPerfil.png"));
	}

}