package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.modelo.Rol;

public interface RolRepository extends JpaRepository<Rol, Integer> {

	Optional<Rol> findByNombre(String nombre);

}
