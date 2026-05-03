package com.example.demo.security;

import java.util.List;

import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.demo.repository.UsuarioRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

	private final UsuarioRepository repo;

	public CustomUserDetailsService(UsuarioRepository repo) {
		this.repo = repo;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		var u = repo.findByUsername(username)
			.orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

		// Bloqueo si no esta aprobado
		if (u.getActivo() == null || !u.getActivo()) {
			throw new DisabledException("Tu cuenta está pendiente de aprobación.");
		}

		// roles.nombre -> "administrador", "central", etc.
		String roleName = (u.getRol() != null && u.getRol().getNombre() != null) ? u.getRol().getNombre() : "PENDIENTE"; // fallback
																															// por
																															// si
																															// un
																															// usuario
																															// quedó
																															// sin
																															// rol

		String role = "ROLE_" + roleName.toUpperCase();

		return new org.springframework.security.core.userdetails.User(u.getUsername(), u.getPassword(),
				List.of(new SimpleGrantedAuthority(role)));
	}

}
