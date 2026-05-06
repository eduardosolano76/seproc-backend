package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.modelo.SolicitudProyecto;

public interface SolicitudProyectoRepository extends JpaRepository<SolicitudProyecto, Integer> {

	// Metodos multitenant (Blindados por Institución)
	// Para el rol Central/Administrador: Lista solicitudes por estado, DENTRO de la
	// institución
	List<SolicitudProyecto> findByEstadoSolicitudOrderByFechaSolicitudDesc(String estadoSolicitud);

	// Para el Constructor: Ve SUS solicitudes DENTRO de la institución
	List<SolicitudProyecto> findByIdUsuarioContratistaOrderByFechaSolicitudDesc(Long idUsuarioContratista);

}