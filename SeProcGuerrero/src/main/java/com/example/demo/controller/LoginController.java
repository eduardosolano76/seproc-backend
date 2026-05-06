package com.example.demo.controller;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.example.demo.modelo.Institucion;
import com.example.demo.repository.InstitucionRepository;
import com.example.demo.storage.StorageService;

@Controller
public class LoginController {

	private final InstitucionRepository institucionRepo;
	private final StorageService storageService;

	public LoginController(InstitucionRepository institucionRepo, StorageService storageService) {
		this.institucionRepo = institucionRepo;
		this.storageService = storageService;
	}
	
	@GetMapping("/login")
	public String loginBase(Model model) {
		// Pasamos null en abreviación para que muestre el "Acceso Central"
		return procesarLogin(null, model);
	}

	// /login/{abreviacion}
	@GetMapping("/login/{abreviacion}")
	public String loginTenant(@PathVariable String abreviacion, Model model) {

		Institucion inst = institucionRepo.findByAbreviacionIgnoreCase(abreviacion).orElse(null);
		if (inst == null || inst.getActiva() == 0) {
			// Si escriben /login/empresa_inventada, los mandamos al login genérico
			return "redirect:/login";
		}

		// Pasamos los datos al HTML para cambiar logos, textos y el enlace de
		// "Regístrate"
		model.addAttribute("institucion", inst);
		model.addAttribute("abreviacionUrl", abreviacion.toLowerCase());
		
		model.addAttribute("logoUrl", storageService.publicLogoUrl(inst.getLogoUrl()));

		return procesarLogin(abreviacion, model);
	}

	public String procesarLogin(String abreviacion, Model model) {

		// Obtenemos la información de la sesión actual
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();

		// Verificamos si el usuario ya tiene sesión iniciada (y no es un visitante
		// anónimo)
		if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {

			// Obtenemos sus roles
			var auths = auth.getAuthorities();

			// Redirigimos al módulo que le corresponde para sacarlo del login
			if (auths.stream().anyMatch(
					a -> a.getAuthority().equals("ROLE_ADMINISTRADOR") || a.getAuthority().equals("ADMINISTRADOR"))) {
				return "redirect:/admin";
			}
			if (auths.stream().anyMatch(
					a -> a.getAuthority().equals("ROLE_CONTRATISTA") || a.getAuthority().equals("CONTRATISTA"))) {
				return "redirect:/constructor";
			}
			if (auths.stream().anyMatch(
					a -> a.getAuthority().equals("ROLE_SUPERVISOR") || a.getAuthority().equals("SUPERVISOR"))) {
				return "redirect:/supervisor";
			}
			if (auths.stream()
					.anyMatch(a -> a.getAuthority().equals("ROLE_CENTRAL") || a.getAuthority().equals("CENTRAL"))) {
				return "redirect:/central";
			}
			if (auths.stream()
					.anyMatch(a -> a.getAuthority().equals("ROLE_DIRECCION") || a.getAuthority().equals("DIRECCION"))) {
				return "redirect:/direccion";
			}

			// Por defecto, si el rol no coincide con ninguno, lo mandamos a la raíz.
			return "redirect:/";
		}
		// Si llega aquí, es porque NO tiene sesión activa, así que le mostramos el
		// formulario
		return "login/login"; // templates/login/login.html
	}

}
