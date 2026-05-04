package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.modelo.AdminSistema;

public interface AdminSistemaRepository extends JpaRepository<AdminSistema, Integer>{
	Optional<AdminSistema> findByUsername(String username);
}
