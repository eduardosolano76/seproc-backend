package com.example.demo.security;

import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.demo.modelo.AdminSistema;
import com.example.demo.repository.AdminSistemaRepository;

@Service
public class AdminSistemaDetailsService implements UserDetailsService{
	private final AdminSistemaRepository adminSistemaRepository;
	
	public AdminSistemaDetailsService(AdminSistemaRepository adminSistemaRepository) {
        this.adminSistemaRepository = adminSistemaRepository;
    }
	
	@Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AdminSistema admin = adminSistemaRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Súper Admin no encontrado: " + username));

        // Le inyectamos el rol 'ROLE_SUPERADMIN' directamente
        return new org.springframework.security.core.userdetails.User(
                admin.getUsername(), 
                admin.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_SUPERADMIN"))
        );
    }
}
