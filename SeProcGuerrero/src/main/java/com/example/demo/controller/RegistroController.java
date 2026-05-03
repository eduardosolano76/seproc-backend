package com.example.demo.controller;

import java.time.LocalDate;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.demo.dto.RegistroDto;
import com.example.demo.modelo.Usuario;
import com.example.demo.repository.UsuarioRepository;

import jakarta.validation.Valid;

@Controller
@RequestMapping("/registro")
public class RegistroController {

	private final UsuarioRepository usuarioRepo;

	private final PasswordEncoder encoder;

	public RegistroController(UsuarioRepository usuarioRepo, PasswordEncoder encoder) {
		this.usuarioRepo = usuarioRepo;
		this.encoder = encoder;
	}

	// Formulario
	@GetMapping
	public String form(Model model) {
		model.addAttribute("registro", new RegistroDto());
		return "registro/registro";
	}

	// Guardar registro como PENDIENTE (activo=false, sin rol)
	@PostMapping
	public String registrar(@Valid @ModelAttribute("registro") RegistroDto dto, BindingResult br, Model model) {

		if (usuarioRepo.existsByUsername(dto.getUsername())) {
			br.rejectValue("username", "username.duplicado", "Ese username ya está registrado.");
		}
		if (usuarioRepo.existsByEmail(dto.getEmail())) {
			br.rejectValue("email", "email.duplicado", "Ese correo ya está registrado.");
		}

		if (br.hasErrors()) {
			return "registro/registro";
		}

		Usuario u = new Usuario();
		u.setUsername(dto.getUsername());
		u.setPassword(encoder.encode(dto.getPassword()));
		u.setNombre(dto.getNombre());
		u.setApellido(dto.getApellido());
		u.setEmail(dto.getEmail());
		u.setFechaRegistro(LocalDate.now());

		// IMPORTANTE: queda pendiente
		u.setActivo(false);
		u.setRol(null); // el admin lo asigna al aprobar

		usuarioRepo.save(u);

		return "redirect:/registro/exito";
	}

	@GetMapping("/exito")
	public String exito() {
		return "registro/registro-exito";
	}

}
