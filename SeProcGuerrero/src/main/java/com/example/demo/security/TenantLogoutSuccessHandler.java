package com.example.demo.security;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.modelo.Usuario;
import com.example.demo.repository.UsuarioRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class TenantLogoutSuccessHandler implements LogoutSuccessHandler{
	
	private final UsuarioRepository usuarioRepo;

	public TenantLogoutSuccessHandler(UsuarioRepository usuarioRepo) {
		this.usuarioRepo = usuarioRepo;
	}

	@Override
	@Transactional 
	public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
			throws IOException, ServletException {
		
		String targetUrl = "/login?logout=true"; // Ruta por defecto si algo falla

		try {
			// Verificamos si hay un usuario autenticado al momento de cerrar sesión
			if (authentication != null && authentication.getName() != null) {
				Usuario usuario = usuarioRepo.findByUsername(authentication.getName()).orElse(null);
				
				// Si el usuario existe y tiene una institución asignada
				if (usuario != null && usuario.getInstitucion() != null) {
					String abreviacion = usuario.getInstitucion().getAbreviacion();
					
					if (abreviacion != null && !abreviacion.isBlank()) {
						// Armamos la URL dinámica y la asignamos
						targetUrl = "/login/" + abreviacion.toLowerCase() + "?logout=true";
					}
				}
			}
		} catch (Exception e) {
			System.out.println("Error al calcular el logout dinámico: " + e.getMessage());
		}

		// Redirigir a la URL calculada (dinámica o genérica)
		response.sendRedirect(targetUrl);
	}
}
