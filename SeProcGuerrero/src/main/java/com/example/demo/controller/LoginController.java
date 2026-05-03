package com.example.demo.controller;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginController {

	@GetMapping("/login")
	public String login() {

		// 1. Obtenemos la información de la sesión actual
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();

		// 2. Verificamos si el usuario ya tiene sesión iniciada (y no es un visitante
		// anónimo)
		if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {

			// 3. Obtenemos sus roles
			var auths = auth.getAuthorities();

			// 4. Redirigimos al módulo que le corresponde para sacarlo del login
			if (auths.stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRADOR")
						|| a.getAuthority().equals("ADMINISTRADOR"))) {
				return "redirect:/admin";
			}
			if (auths.stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_CONTRATISTA") || a.getAuthority().equals("CONTRATISTA"))) {
				return "redirect:/constructor";
			}
			if (auths.stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_SUPERVISOR") || a.getAuthority().equals("SUPERVISOR"))) {
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
