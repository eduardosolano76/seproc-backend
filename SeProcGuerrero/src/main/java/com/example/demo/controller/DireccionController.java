package com.example.demo.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.demo.modelo.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.storage.StorageService;

import jakarta.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/direccion")
public class DireccionController {

	private final UsuarioRepository usuarioRepo;
	private final StorageService storageService;

	public DireccionController(UsuarioRepository usuarioRepo, StorageService storageService) {
		this.usuarioRepo = usuarioRepo;
		this.storageService = storageService;
	}

	@GetMapping
	public String vistaDireccion(@RequestParam(defaultValue = "proyectos") String view, Authentication auth,
			Model model, HttpServletRequest request) {

		Usuario usuario = usuarioRepo.findByUsername(auth.getName()).orElse(null);

		model.addAttribute("view", view);
		model.addAttribute("loggedUsername", auth.getName());
		model.addAttribute("nombreUsuario", usuario != null ? usuario.getNombre() : "director");
		model.addAttribute("rolUsuario", "direccion");
		model.addAttribute("fotoUrl", usuario != null ? usuario.getFoto() : null);
		
		if (usuario.getInstitucion() != null) {
			model.addAttribute("logoEmpresa", storageService.publicLogoUrl(usuario.getInstitucion().getLogoUrl()));
		} else {
			model.addAttribute("logoEmpresa", "/assets/iconos/logoIgife.jpg");
		}

		String requestedWith = request.getHeader("X-Requested-With");
		if ("XMLHttpRequest".equalsIgnoreCase(requestedWith)) {
			return "direccion/direccion :: #panelContent";
		}

		return "direccion/direccion";
	}

	@PostMapping("/perfil/password")
	@ResponseBody
	public ResponseEntity<?> cambiarPassword(@RequestBody Map<String, String> body) {
		return ResponseEntity.ok().build();
	}

	@PostMapping("/perfil/foto")
	@ResponseBody
	public ResponseEntity<?> subirFoto() {
		Map<String, Object> out = new HashMap<>();
		out.put("url", "/assets/iconos/sinFotoPerfil.png");
		return ResponseEntity.ok(out);
	}

	@DeleteMapping("/perfil/foto")
	@ResponseBody
	public ResponseEntity<?> eliminarFoto() {
		Map<String, Object> out = new HashMap<>();
		out.put("url", "/assets/iconos/sinFotoPerfil.png");
		return ResponseEntity.ok(out);
	}

}
