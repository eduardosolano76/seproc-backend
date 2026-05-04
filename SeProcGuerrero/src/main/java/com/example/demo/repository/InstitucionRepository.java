package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.modelo.Institucion;

public interface InstitucionRepository extends JpaRepository<Institucion, String> {

}
