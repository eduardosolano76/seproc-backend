package com.example.demo.security;

import java.util.List;

import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.example.demo.modelo.Usuario;
import com.example.demo.repository.UsuarioRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class CustomUserDetailsService implements UserDetailsService {

	private final UsuarioRepository repo;

	public CustomUserDetailsService(UsuarioRepository repo) {
		this.repo = repo;
	}

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        String empresa = obtenerEmpresaDesdeRequest();

        if (empresa == null || empresa.isBlank()) {
            throw new UsernameNotFoundException("Debes iniciar sesión desde el portal de tu institución.");
        }

        Usuario u = repo.findByUsernameAndInstitucionAbreviacion(username, empresa)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado para la institución: " + empresa
                ));

        if (u.getInstitucion() == null) {
            throw new UsernameNotFoundException("El usuario no tiene institución asignada.");
        }

        if (u.getInstitucion().getActiva() == null || u.getInstitucion().getActiva() == 0) {
            throw new DisabledException("La institución se encuentra inactiva.");
        }

        if (u.getActivo() == null || !u.getActivo()) {
            throw new DisabledException("Tu cuenta está pendiente de aprobación.");
        }

        String roleName = u.getRol() != null && u.getRol().getNombre() != null
                ? u.getRol().getNombre()
                : "PENDIENTE";

        String role = "ROLE_" + roleName.toUpperCase();

        return new org.springframework.security.core.userdetails.User(
                u.getUsername(),
                u.getPassword(),
                List.of(new SimpleGrantedAuthority(role))
        );
    }

    private String obtenerEmpresaDesdeRequest() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attrs == null) {
                return null;
            }
            
            HttpServletRequest request = attrs.getRequest();
            String empresa = request.getParameter("empresa");

            if (empresa == null) {
                return null;
            }

            return empresa.trim().toLowerCase();
        } catch (Exception e) {
            return null;
        }
    }
}
