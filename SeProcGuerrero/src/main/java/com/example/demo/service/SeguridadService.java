package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.demo.modelo.Institucion;
import com.example.demo.modelo.Usuario;
import com.example.demo.repository.UsuarioRepository;

@Service
public class SeguridadService {

	@Autowired
	private UsuarioRepository usuarioRepository;

	// Obtiene el objeto Usuario completo de la persona que tiene la sesión iniciada.
	public Usuario getUsuarioLogueado() {
		// Obtenemos el contexto de seguridad actual de Spring
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		// Verificamos que realmente haya alguien logueado y que no sea el usuario anónimo
		// por defecto
		if (authentication == null || !authentication.isAuthenticated()
				|| "anonymousUser".equals(authentication.getPrincipal())) {
			return null;
		}

		String username = authentication.getName(); // Extraemos el username

		// Buscamos en la BD y lo devolvemos
		return usuarioRepository.findByUsername(username).orElse(null);
	}

	public Institucion getInstitucionActual() {
		Usuario usuario = getUsuarioLogueado();
		if (usuario != null) {
			return usuario.getInstitucion();
		}
		return null;
	}

}
