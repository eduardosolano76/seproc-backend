package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.modelo.Institucion;
import com.example.demo.modelo.SolicitudProyecto;

public interface SolicitudProyectoRepository extends JpaRepository<SolicitudProyecto, Integer> {

	// Metodos multitenant (Blindados por Institución)

	// Obtener todas las solicitudes de la empresa
	List<SolicitudProyecto> findByInstitucion(Institucion institucion);

	// Para el rol Central/Administrador: Lista solicitudes por estado, DENTRO de la
	// institución
	List<SolicitudProyecto> findByInstitucionAndEstadoSolicitudOrderByFechaSolicitudDesc(Institucion institucion,
			String estadoSolicitud);

	// Para el Constructor: Ve SUS solicitudes DENTRO de la institución
	List<SolicitudProyecto> findByInstitucionAndIdUsuarioContratistaOrderByFechaSolicitudDesc(Institucion institucion,
			Long idUsuarioContratista);

}