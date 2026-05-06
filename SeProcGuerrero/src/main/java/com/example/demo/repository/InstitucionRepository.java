package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.modelo.Institucion;

public interface InstitucionRepository extends JpaRepository<Institucion, String> {
	
	// Busca ignorando mayúsculas/minúsculas (ej: "igife" o "IGIFE")
	Optional<Institucion> findByAbreviacionIgnoreCase(String abreviacion);
	
	List<Institucion> findByActiva(Integer activa);

}
