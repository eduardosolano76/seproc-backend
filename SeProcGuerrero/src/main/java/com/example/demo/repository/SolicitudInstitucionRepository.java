package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.modelo.SolicitudInstitucion;

@Repository
public interface SolicitudInstitucionRepository extends JpaRepository<SolicitudInstitucion, Integer> {

}
