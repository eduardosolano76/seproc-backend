package com.example.demo.config;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.demo.modelo.Usuario;
import com.example.demo.repository.UsuarioRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class TenantFilter extends OncePerRequestFilter {
	
	private final UsuarioRepository usuarioRepository;

    public TenantFilter(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // Obtener la sesión actual de Spring Security
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Si hay alguien logueado
        if (authentication != null && authentication.isAuthenticated() 
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            
            String username = authentication.getName();
            
            // Buscamos el usuario en la BD para saber a qué institución pertenece
            Usuario usuario = usuarioRepository.findByUsername(username).orElse(null);
            
            if (usuario != null && usuario.getInstitucion() != null) {
                // Guardamos el ID de la institución en el contexto del hilo
                TenantContext.setCurrentTenant(usuario.getInstitucion().getIdInstitucion());
            }
        }

        try {
            // Continuar con la petición 
            filterChain.doFilter(request, response);
        } finally {
            
            TenantContext.clear();
        }
    }

}
