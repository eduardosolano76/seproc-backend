package com.example.demo.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.CambiarPasswordDto;
import com.example.demo.modelo.Proyecto;
import com.example.demo.modelo.SolicitudProyecto;
import com.example.demo.repository.ProyectoRepository;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.PerfilService;
import com.example.demo.storage.StorageService;

@Controller
public class ConstructorController {

	private final UsuarioRepository usuarioRepo;

	private final ProyectoRepository proyectoRepo;

	private final StorageService storageService;

	private final PerfilService perfilService;

	public ConstructorController(UsuarioRepository usuarioRepo, ProyectoRepository proyectoRepo,
			StorageService storageService, PerfilService perfilService) {
		this.usuarioRepo = usuarioRepo;
		this.proyectoRepo = proyectoRepo;
		this.storageService = storageService;
		this.perfilService = perfilService;
	}

	@GetMapping("/constructor")
	public String constructor(Model model, Principal principal,
			@RequestParam(name = "view", required = false, defaultValue = "projects") String view) {

		cargarDatosUsuario(model, principal);
		model.addAttribute("vistaActiva", view);

		return "constructor/constructor";
	}

	@GetMapping("/constructor/proyectos/{id}/avance")
	public String avanceProyecto(@PathVariable Integer id, Model model, Principal principal) {

		cargarDatosUsuario(model, principal);

		String username = principal.getName();
		var usuario = usuarioRepo.findByUsername(username).orElse(null);
		if (usuario == null) {
			return "redirect:/constructor";
		}

		Proyecto proyecto = proyectoRepo.findById(id).orElse(null);
		if (proyecto == null) {
			return "redirect:/constructor";
		}

		SolicitudProyecto solicitud = proyecto.getSolicitud();
		if (solicitud == null || !usuario.getIdUsuario().equals(solicitud.getIdUsuarioContratista())) {
			return "redirect:/constructor";
		}

		String tipoEdificacion = solicitud.getTipoEdificacion() != null ? solicitud.getTipoEdificacion().getNombre()
				: "";

		Integer numeroNiveles = solicitud.getTipoEdificacion() != null
				? solicitud.getTipoEdificacion().getNumeroNiveles() : 1;

		model.addAttribute("vistaActiva", "projects");
		model.addAttribute("idProyecto", proyecto.getIdProyecto());
		model.addAttribute("nombreEscuela", solicitud.getNombreEscuela());
		model.addAttribute("tipoObra", solicitud.getTipoObra());
		model.addAttribute("tipoEdificacion", tipoEdificacion);
		model.addAttribute("numeroNiveles", numeroNiveles);
		model.addAttribute("avanceGeneral", 25); // visual temporal
		model.addAttribute("etapaActual", "Cimentación");

		return "constructor/proceso";
	}

	private void cargarDatosUsuario(Model model, Principal principal) {
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
	}

	@PostMapping("/constructor/perfil/password")
	@ResponseBody
	public ResponseEntity<?> cambiarPassword(@RequestBody CambiarPasswordDto dto, Principal principal) {
		perfilService.cambiarPassword(principal.getName(), dto);
		return ResponseEntity.ok().build();
	}

	@PostMapping(value = "/constructor/perfil/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseBody
	public ResponseEntity<?> subirFotoPerfil(@RequestParam("file") MultipartFile file, Principal principal) {

		String username = principal.getName();
		var usuario = usuarioRepo.findByUsername(username).orElse(null);

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

	@GetMapping("/constructor/perfil/foto")
	@ResponseBody
	public ResponseEntity<?> obtenerFotoPerfil(Principal principal) {
		String username = principal.getName();
		var usuario = usuarioRepo.findByUsername(username).orElse(null);

		if (usuario == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado.");
		}

		String url = storageService.publicUrl(usuario.getFoto());
		if (url == null || url.isBlank()) {
			url = "/assets/iconos/sinFotoPerfil.png";
		}

		return ResponseEntity.ok(Map.of("url", url));
	}

	@DeleteMapping("/constructor/perfil/foto")
	@ResponseBody
	public ResponseEntity<?> eliminarFotoPerfil(Principal principal) {
		perfilService.eliminarFotoPerfil(principal.getName());
		return ResponseEntity
			.ok(Map.of("message", "Foto eliminada correctamente", "url", "/assets/iconos/sinFotoPerfil.png"));
	}

}