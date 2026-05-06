package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.UsuarioUpsertDto;
import com.example.demo.modelo.Rol;
import com.example.demo.modelo.Usuario;
import com.example.demo.repository.RolRepository;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.SeguridadService;

@RestController
@RequestMapping("/api/central/usuarios")
public class CentralUsuariosApiController {

	private final UsuarioRepository usuarioRepo;
	private final RolRepository rolRepo;
	private final PasswordEncoder passwordEncoder;
	private final SeguridadService seguridadService;

	public CentralUsuariosApiController(UsuarioRepository usuarioRepo, RolRepository rolRepo,
			PasswordEncoder passwordEncoder, SeguridadService seguridadService) {
		this.usuarioRepo = usuarioRepo;
		this.rolRepo = rolRepo;
		this.passwordEncoder = passwordEncoder;
		this.seguridadService = seguridadService;
	}

	@GetMapping("/{id}")
	public ResponseEntity<?> detalle(@PathVariable Long id) {
		Usuario u = usuarioRepo.findById(id).orElse(null);
		if (u == null)
			return ResponseEntity.notFound().build();
		return ResponseEntity.ok(u);
	}

	@PostMapping("/crear")
	public ResponseEntity<?> crear(@RequestBody UsuarioUpsertDto dto) {

		if (dto.getNombre() == null || dto.getNombre().isBlank()) {
			return ResponseEntity.badRequest().body("Nombre obligatorio.");
		}
		if (dto.getApellido() == null || dto.getApellido().isBlank()) {
			return ResponseEntity.badRequest().body("Apellido obligatorio.");
		}
		if (dto.getUsername() == null || dto.getUsername().isBlank()) {
			return ResponseEntity.badRequest().body("Username obligatorio.");
		}
		if (dto.getEmail() == null || dto.getEmail().isBlank()) {
			return ResponseEntity.badRequest().body("Email obligatorio.");
		}
		if (dto.getPassword() == null || dto.getPassword().isBlank()) {
			return ResponseEntity.badRequest().body("Password obligatorio.");
		}

		if (usuarioRepo.existsByUsername(dto.getUsername())) {
			return ResponseEntity.badRequest().body("Username ya existe.");
		}
		if (usuarioRepo.existsByEmail(dto.getEmail())) {
			return ResponseEntity.badRequest().body("Email ya existe.");
		}

		String rolNombre = dto.getRolNombre() == null ? "" : dto.getRolNombre().trim().toLowerCase();

		if (!rolNombre.equals("supervisor") && !rolNombre.equals("contratista") && !rolNombre.equals("direccion")) {
			return ResponseEntity.badRequest().body("Central solo puede crear supervisor, contratista o direccion.");
		}

		Rol rol = rolRepo.findByNombre(rolNombre).orElse(null);
		if (rol == null) {
			return ResponseEntity.badRequest().body("Rol no válido.");
		}

		Usuario u = new Usuario();
		u.setNombre(dto.getNombre().trim());
		u.setApellido(dto.getApellido().trim());
		u.setUsername(dto.getUsername().trim());
		u.setEmail(dto.getEmail().trim());
		u.setPassword(passwordEncoder.encode(dto.getPassword()));
		u.setActivo(true);
		u.setRol(rol);
		
		u.setInstitucion(seguridadService.getInstitucionActual());

		usuarioRepo.save(u);
		return ResponseEntity.status(HttpStatus.CREATED).build();
	}

	@PostMapping("/{id}/actualizar")
	public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody UsuarioUpsertDto dto) {
		Usuario u = usuarioRepo.findById(id).orElse(null);
		if (u == null)
			return ResponseEntity.notFound().build();

		String rolActual = (u.getRol() != null && u.getRol().getNombre() != null) ? u.getRol().getNombre().toLowerCase()
				: "";

		if (!rolActual.equals("supervisor") && !rolActual.equals("contratista") && !rolActual.equals("direccion")) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Central no puede editar este tipo de usuario.");
		}

		if (dto.getUsername() != null && !dto.getUsername().equalsIgnoreCase(u.getUsername())
				&& usuarioRepo.existsByUsername(dto.getUsername())) {
			return ResponseEntity.badRequest().body("Username ya existe.");
		}

		if (dto.getEmail() != null && !dto.getEmail().equalsIgnoreCase(u.getEmail())
				&& usuarioRepo.existsByEmail(dto.getEmail())) {
			return ResponseEntity.badRequest().body("Email ya existe.");
		}

		u.setNombre(dto.getNombre());
		u.setApellido(dto.getApellido());
		u.setUsername(dto.getUsername());
		u.setEmail(dto.getEmail());

		if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
			u.setPassword(passwordEncoder.encode(dto.getPassword()));
		}

		usuarioRepo.save(u);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/{id}/eliminar")
	public ResponseEntity<?> eliminar(@PathVariable Long id) {
		Usuario u = usuarioRepo.findById(id).orElse(null);
		if (u == null)
			return ResponseEntity.notFound().build();

		String rolActual = (u.getRol() != null && u.getRol().getNombre() != null) ? u.getRol().getNombre().toLowerCase()
				: "";

		if (!rolActual.equals("supervisor") && !rolActual.equals("contratista") && !rolActual.equals("direccion")) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Central no puede eliminar este tipo de usuario.");
		}

		usuarioRepo.deleteById(id);
		return ResponseEntity.ok().build();
	}

}