package com.example.demo.controller;

import java.time.LocalDate;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import com.example.demo.dto.RegistroDto;
import com.example.demo.modelo.Institucion;
import com.example.demo.modelo.Usuario;
import com.example.demo.repository.InstitucionRepository;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.storage.StorageService;

import jakarta.validation.Valid;

@Controller
public class RegistroController {

	private final UsuarioRepository usuarioRepo;
	private final PasswordEncoder encoder;
	private final InstitucionRepository institucionRepo;
	private final StorageService storageService;
	
	public RegistroController(UsuarioRepository usuarioRepo, PasswordEncoder encoder, InstitucionRepository institucionRepo, StorageService storageService) {
		this.usuarioRepo = usuarioRepo;
		this.encoder = encoder;
		this.institucionRepo = institucionRepo;
		this.storageService = storageService;
	}
	
	// GET: /registro/{abreviacion}
	// Formulario
	@GetMapping("/registro/{abreviacion}")
	public String form(@PathVariable String abreviacion, Model model) {
		// Buscar la institución
		Institucion inst = institucionRepo.findByAbreviacionIgnoreCase(abreviacion).orElse(null);

		// Si no existe o está inactiva, redirigir a un error genérico (o al login
		// default)
		if (inst == null || inst.getActiva() == 0) {
			return "redirect:/login?error=institucion_invalida";
		}

		// Pasamos los datos al formulario
		RegistroDto dto = new RegistroDto();
		model.addAttribute("registro", dto);
		model.addAttribute("institucion", inst); // Pasamos el objeto completo para usar su logo y nombre
		model.addAttribute("abreviacionUrl", abreviacion.toLowerCase()); // Para armar el action del form
		
		model.addAttribute("logoUrl", storageService.publicLogoUrl(inst.getLogoUrl()));

		return "registro/registro";
	}

	// POST: /registro/{abreviacion}
	// Guardar registro como PENDIENTE (activo=false, sin rol)
	@PostMapping("/registro/{abreviacion}")
	public String registrar(@PathVariable String abreviacion, @Valid @ModelAttribute("registro") RegistroDto dto,
			BindingResult br, Model model) {

		// Validar la institución nuevamente por seguridad
		Institucion inst = institucionRepo.findByAbreviacionIgnoreCase(abreviacion).orElse(null);
		if (inst == null || inst.getActiva() == 0) {
			return "redirect:/login?error=institucion_invalida";
		}

		if (usuarioRepo.existsByUsername(dto.getUsername())) {
			br.rejectValue("username", "username.duplicado", "Ese username ya está registrado.");
		}
		if (usuarioRepo.existsByEmail(dto.getEmail())) {
			br.rejectValue("email", "email.duplicado", "Ese correo ya está registrado.");
		}

		if (br.hasErrors()) {
			model.addAttribute("institucion", inst);
			model.addAttribute("abreviacionUrl", abreviacion.toLowerCase());
			return "registro/registro";
		}

		Usuario u = new Usuario();
		u.setUsername(dto.getUsername());
		u.setPassword(encoder.encode(dto.getPassword()));
		u.setNombre(dto.getNombre());
		u.setApellido(dto.getApellido());
		u.setEmail(dto.getEmail());
		u.setFechaRegistro(LocalDate.now());
		
		u.setInstitucion(inst);
		
		// IMPORTANTE: queda pendiente
		u.setActivo(false);
		u.setRol(null); // el admin lo asigna al aprobar

		usuarioRepo.save(u);

		return "redirect:/registro/" + abreviacion.toLowerCase() + "/exito";
	}
	
	// GET: /registro/{abreviacion}/exito
	@GetMapping("/registro/{abreviacion}/exito")
	public String exito(@PathVariable String abreviacion, Model model) {
		Institucion inst = institucionRepo.findByAbreviacionIgnoreCase(abreviacion).orElse(null);
		if (inst != null) {
			model.addAttribute("institucion", inst);
			model.addAttribute("abreviacionUrl", abreviacion.toLowerCase());
			model.addAttribute("logoUrl", storageService.publicLogoUrl(inst.getLogoUrl()));
		}
		return "registro/registro-exito";
	}

}
