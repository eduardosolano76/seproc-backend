package com.example.demo.security;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RoleRedirectSuccessHandler implements AuthenticationSuccessHandler {

	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
			Authentication authentication) throws IOException, ServletException {

		var auths = authentication.getAuthorities();

		boolean isAdmin = auths.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRADOR"));
		boolean isContratista = auths.stream().anyMatch(a -> a.getAuthority().equals("ROLE_CONTRATISTA"));
		boolean isSupervisor = auths.stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPERVISOR"));
		boolean isCentral = auths.stream().anyMatch(a -> a.getAuthority().equals("ROLE_CENTRAL"));
		boolean isDireccion = auths.stream().anyMatch(a -> a.getAuthority().equals("ROLE_DIRECCION"));

		if (isAdmin) {
			response.sendRedirect("/admin");
			return;
		}
		if (isContratista) {
			response.sendRedirect("/constructor");
			return;
		}
		if (isSupervisor) {
			response.sendRedirect("/supervisor");
			return;
		}
		if (isCentral) {
			response.sendRedirect("/central");
			return;
		}
		if (isDireccion) {
			response.sendRedirect("/direccion");
			return;
		}

		response.sendRedirect("/login?error=rol");
	}

}